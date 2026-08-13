import mongoose from "mongoose";
import 'dotenv/config';
import app from "./app.js";

const port = process.env.PORT || 5000;

const requiredEnv = ["MONGO_URI", "JWT_SECRET_KEY"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error("Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}

const uri = process.env.MONGO_URI;

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
