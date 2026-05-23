import mongoose from "mongoose";
import fs from "fs/promises";
import dotenv from "dotenv";

import User from "./models/User.js";
import Resource from "./models/Resource.js";
import Announcement from "./models/Announcement.js";
import Leaderboard from "./models/Leaderboard.js";

dotenv.config();

const migrateData = async () => {
  try {
    // Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // Read JSON file
    const rawData = await fs.readFile("./backend/data/db.json", "utf-8");

    const data = JSON.parse(rawData);

    console.log("JSON data loaded");

    // Clear existing collections
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Announcement.deleteMany({});
    await Leaderboard.deleteMany({});

    console.log("Old collections cleared");

    // Insert data
    await User.insertMany(data.users);

    await Resource.insertMany(data.resources);

    await Announcement.insertMany(data.announcements);

    await Leaderboard.insertMany(data.leaderboard);

    console.log("Migration completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);

    process.exit(1);
  }
};

migrateData();