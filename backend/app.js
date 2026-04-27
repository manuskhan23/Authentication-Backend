import express from "express";
import mongoose from "mongoose";
import postModel from "./models/postModel.js";
import signupModel from "./models/userModel.js";
import bcrypt from "bcrypt";
import 'dotenv/config';
import jwt from "jsonwebtoken";
import cors from "cors";

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
app.post("/api/createpost", async (req, res) => {
  try {
    const saveData = await postModel.create(req.body);
    res.status(201).json(saveData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get post
app.get("/api/getpost", async (req, res) => {
  try {
    const getData = await postModel.find({ post_title: "title 01" });
    res.json(getData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update post
app.put("/api/updatepost", async (req, res) => {
  try {
    await postModel.findByIdAndUpdate(
      "69e482145220f13556b60d6c",
      req.body
    );

    res.json("data updated successfully...");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// delete post
app.delete("/api/deletepost/:id", async (req, res) => {
  try {
    await postModel.findByIdAndDelete(req.params.id);
    res.json("data deleted successfully...");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= AUTH =================

// SIGNUP
app.post("/api/v1/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Required fields are missing..."
      });
    }

    console.log("Checking email:", email);
    const emailExist = await signupModel.findOne({ email });
    console.log("Email found:", emailExist);

    if (emailExist) {
      return res.status(409).json({
        message: "Email already exists.."
      });
    }

    const encryptPassword = await bcrypt.hash(password, 10);

    const userObj = {
      firstName,
      lastName,
      email,
      password: encryptPassword
    };

    const saveData = await signupModel.create(userObj);

    res.status(201).json({
      message: "User created successfully",
      status: true,
      saveData
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// LOGIN
app.post("/api/v1/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Required fields are missing"
      });
    }

    const user = await signupModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // ✅ FIXED: no password in token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// ================= SERVER =================

app.listen(port, () => {
  console.log("server is running on port", port);
});