import mongoose from "mongoose";
import 'dotenv/config';
import app from "./app.js";

const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI is not set");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

mongoose.connect(uri);

mongoose.connection.on("connected", () => {
  console.log("mongodb connected successfully...");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongo Error:", err);
});

app.listen(port, () => {
  console.log("server is running on port", port);
});
