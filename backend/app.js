import express from "express";
import mongoose from "mongoose";
import postModel from "./models/postModel.js";
import signupModel from "./models/userModel.js";
import bcrypt from "bcrypt";
import 'dotenv/config';
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

const requiredEnv = ["MONGO_URI", "JWT_SECRET_KEY"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error("Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}

const uri = process.env.MONGO_URI;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ================= ERROR HELPERS =================

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// forwards rejected promises to the error middleware instead of leaving them unhandled
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// ================= ROUTES =================

// test route
app.get("/", (req, res) => {
  res.json("hello");
});

// ---------------- POST APIs ----------------

// create post
app.post("/api/createpost", asyncHandler(async (req, res) => {
  const saveData = await postModel.create(req.body);
  res.status(201).json(saveData);
}));

// get post
app.get("/api/getpost", asyncHandler(async (req, res) => {
  const getData = await postModel.find({ post_title: "title 01" });
  res.json(getData);
}));

// update post
app.put("/api/updatepost/:id", asyncHandler(async (req, res) => {
  const updated = await postModel.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true
  });

  if (!updated) {
    throw new HttpError(404, "Post not found");
  }

  res.json(updated);
}));

// delete post
app.delete("/api/deletepost/:id", asyncHandler(async (req, res) => {
  const deleted = await postModel.findByIdAndDelete(req.params.id);

  if (!deleted) {
    throw new HttpError(404, "Post not found");
  }

  res.json("data deleted successfully...");
}));

// ================= AUTH =================

// SIGNUP
app.post("/api/v1/signup", asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new HttpError(400, "Required fields are missing...");
  }

  const emailExist = await signupModel.findOne({ email });

  if (emailExist) {
    throw new HttpError(409, "Email already exists..");
  }

  const encryptPassword = await bcrypt.hash(password, 10);

  const user = await signupModel.create({
    firstName,
    lastName,
    email,
    password: encryptPassword
  });

  res.status(201).json({
    message: "User created successfully",
    status: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }
  });
}));

// LOGIN
app.post("/api/v1/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "Required fields are missing");
  }

  const user = await signupModel.findOne({ email });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET_KEY,
  );

  res.status(200).json({
    message: "Login successful",
    token
  });
}));

// ================= ERROR HANDLING =================

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Resource already exists" });
  }

  // malformed JSON body raised by express.json()
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, error);
  res.status(500).json({ message: "Internal server error" });
});

// ================= SERVER =================

mongoose.connection.on("error", (err) => {
  console.error("Mongo Error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.error("mongodb disconnected");
});

const start = async () => {
  try {
    await mongoose.connect(uri);
    console.log("mongodb connected successfully...");
  } catch (error) {
    console.error("Failed to connect to mongodb:", error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log("server is running on port", port);
  });
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

start();
