import express from "express";
import mongoose from "mongoose";
import postModel from "./models/postModel.js";
import signupModel from "./models/userModel.js";
import bcrypt from "bcrypt";
import 'dotenv/config';
import jwt from "jsonwebtoken";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const port = process.env.PORT || 5000;

const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;
const tokenExpiry = process.env.JWT_EXPIRES_IN || "1h";

if (!uri) {
  throw new Error("MONGO_URI is not set");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not set");
}

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));

// DB connection
mongoose.connect(uri);

mongoose.connection.on("connected", () => {
  console.log("mongodb connected successfully...");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongo Error:", err);
});

// ================= HELPERS =================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Rejects non-string payloads such as { "$ne": null }, which would otherwise
// reach Mongo as query operators.
const asString = (value) => (typeof value === "string" ? value.trim() : "");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const handleError = (res, error, context) => {
  console.error(`${context} failed:`, error);
  res.status(500).json({ message: "Internal server error" });
};

// ================= ROUTES =================

// health check
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------- POST APIs ----------------

// create post
app.post("/api/createpost", requireAuth, async (req, res) => {
  try {
    const post_title = asString(req.body?.post_title);
    const post_desc = asString(req.body?.post_desc);

    if (!post_title) {
      return res.status(400).json({ message: "post_title is required" });
    }

    const saveData = await postModel.create({
      post_title,
      post_desc,
      author: req.user.id,
    });
    res.status(201).json(saveData);
  } catch (error) {
    handleError(res, error, "createpost");
  }
});

// get posts of the authenticated user
app.get("/api/getpost", requireAuth, async (req, res) => {
  try {
    const getData = await postModel.find({ author: req.user.id });
    res.json(getData);
  } catch (error) {
    handleError(res, error, "getpost");
  }
});

// update post
app.put("/api/updatepost/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const update = {};
    const post_title = asString(req.body?.post_title);
    const post_desc = asString(req.body?.post_desc);

    if (post_title) update.post_title = post_title;
    if (post_desc) update.post_desc = post_desc;

    const updated = await postModel.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(updated);
  } catch (error) {
    handleError(res, error, "updatepost");
  }
});

// delete post
app.delete("/api/deletepost/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const deleted = await postModel.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ message: "data deleted successfully..." });
  } catch (error) {
    handleError(res, error, "deletepost");
  }
});

// ================= AUTH =================

// SIGNUP
app.post("/api/v1/signup", authLimiter, async (req, res) => {
  try {
    const firstName = asString(req.body?.firstName);
    const lastName = asString(req.body?.lastName);
    const email = asString(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Required fields are missing..."
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    const emailExist = await signupModel.findOne({ email });

    if (emailExist) {
      return res.status(409).json({
        message: "Email already exists.."
      });
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

  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Email already exists.." });
    }
    handleError(res, error, "signup");
  }
});

// LOGIN
app.post("/api/v1/login", authLimiter, async (req, res) => {
  try {
    const email = asString(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Required fields are missing"
      });
    }

    const user = await signupModel.findOne({ email }).select("+password");
    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      jwtSecret,
      { expiresIn: tokenExpiry }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (error) {
    handleError(res, error, "login");
  }
});

// ================= SERVER =================

app.listen(port, () => {
  console.log("server is running on port", port);
});
