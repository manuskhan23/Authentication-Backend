import mongoose from "mongoose";
import 'dotenv/config';
import app from "./app.js";

const port = 5000;
const uri = process.env.MONGO_URI;

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
