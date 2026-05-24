import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log("Using cached MongoDB connection");
    return cachedConnection;
  }

  console.log("Checking MONGO_URI environment variable presence...");
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from environment variables!");
    throw new Error("MONGO_URI environment variable is missing");
  }

  try {
    console.log("Establishing new MongoDB connection...");
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected");
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    throw error;
  }
};

export default connectDB;