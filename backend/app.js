import express from "express";
import mongoose from "mongoose";
import postModel from "./models/postModel.js";
import signupModel from "./models/userModel.js";
import bcrypt from "bcrypt";
import 'dotenv/config';
import jwt from "jsonwebtoken";
import cors from "cors";
import asyncHandler from "./utils/asyncHandler.js";
import ApiError from "./utils/ApiError.js";
import validateRequiredFields from "./utils/validateRequiredFields.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const port = 5000;

const uri = process.env.MONGO_URI;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DB connection
mongoose.connect(uri);

mongoose.connection.on("connected", () => {
  console.log("mongodb connected successfully...");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongo Error:", err);
});

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
app.put("/api/updatepost", asyncHandler(async (req, res) => {
  await postModel.findByIdAndUpdate(
    "69e482145220f13556b60d6c",
    req.body
  );

  res.json("data updated successfully...");
}));

// delete post
app.delete("/api/deletepost/:id", asyncHandler(async (req, res) => {
  await postModel.findByIdAndDelete(req.params.id);
  res.json("data deleted successfully...");
}));

// ================= AUTH =================

// SIGNUP
app.post("/api/v1/signup", asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  validateRequiredFields(req.body, ["firstName", "lastName", "email", "password"]);

  const emailExist = await signupModel.findOne({ email });

  if (emailExist) {
    throw new ApiError(409, "Email already exists..");
  }

  const encryptPassword = await bcrypt.hash(password, 10);

  const saveData = await signupModel.create({
    firstName,
    lastName,
    email,
    password: encryptPassword
  });

  res.status(201).json({
    message: "User created successfully",
    status: true,
    saveData
  });
}));

// LOGIN
app.post("/api/v1/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  validateRequiredFields(req.body, ["email", "password"]);

  const user = await signupModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
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

app.use(errorHandler);

// ================= SERVER =================

app.listen(port, () => {
  console.log("server is running on port", port);
});
