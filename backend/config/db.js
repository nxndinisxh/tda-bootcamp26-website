import mongoose from "mongoose";
import User from "../models/User.js";

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
      family: 4
    });
    console.log("MongoDB Connected");

    // Run startup backfill migration for Atlas data consistency (mark legacy users as verified)
    try {
      const result = await User.updateMany(
        { isVerified: { $exists: false } },
        { $set: { isVerified: true } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Database Migration: Set isVerified: true for ${result.modifiedCount} legacy user documents in MongoDB Atlas.`);
      }
    } catch (migErr) {
      console.error("Database Migration Error:", migErr.message);
    }

    return cachedConnection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    throw error;
  }
};

export default connectDB;