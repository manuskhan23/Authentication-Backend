import express from "express"
import mongoose from "mongoose"
import postModel from "./models/postModel.js"
import dotenv from "dotenv"
import signupModel from "./models/userModel.js"
import bcrypt from "bcrypt"

dotenv.config()

const app=express()

const port=5000

const uri=process.env.MONGODB_URI

app.use(express.json());

mongoose.connect(uri);

mongoose.connection.on("connected", () => {
  console.log("mongodb connected successfully...");
});

mongoose.connection.on("error", (err) => {
  console.log(err);
});

// api

// create post-api

app.post("/api/createpost", async (req, res) => {
  try {
    const body = req.body;

    const saveData = await postModel.create(body);

    res.json(saveData);
  } catch (error) {
    console.log(error);
  }
});

// get post-api

app.get("/api/getpost", async (req, res) => {
  try {
    const getData = await postModel.find({ post_title: "title 01" });

    res.json(getData);
  } catch (error) {
    console.log(error);
  }
});

// update post-api

app.put("/api/updatepost", async (req, res) => {
  try {
    const body = req.body;

    const updateData = await postModel.findByIdAndUpdate(
      "69e482145220f13556b60d6c",
      body,
    );

    res.json("data updated successfully...");
  } catch (error) {
    console.log(error);
  }
});

// delete post-api

app.delete("/api/deletepost/:id", async (req, res) => {
  try {
    const params = req.params.id;

    const deleteData = await postModel.findByIdAndDelete(params);

    res.json("data deleted successfully...");
  } catch (error) {
    console.log(error);
  }
});

// signup api

app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(404).json({
        message: "Required fields are missing...",
      });
      return;
    }

    const emailExist = await userModel.findOne({ email });

    if (emailExist !== null) {
      res.status(404).json({
        message: "Invalid email address..",
      });
      return;
    }

    const encryptPassword = await bcrypt.hash(password, 8);

    let userObj = {
      firstName,
      lastName,
      email,
      password: encryptPassword,
    };

    const saveData = await userModel.create(userObj);

    res.status(201).json({
      message: "user created successfully...",
      status: true,
      saveData,
    });
  } catch (error) {
    res.status(503).json({
      message: error,
    });
  }
});

app.listen(port, () => {
  console.log("server is running");
});