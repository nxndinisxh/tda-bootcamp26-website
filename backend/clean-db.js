import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import UserProgress from './models/UserProgress.js';
import Leaderboard from './models/Leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanDatabase = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing from environment variables!');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.');

    // 1. Delete all users who are not super_admin
    console.log('Deleting all users except super_admins...');
    const userDeleteResult = await User.deleteMany({ role: { $ne: 'super_admin' } });
    console.log(`Deleted ${userDeleteResult.deletedCount} user documents.`);

    // 2. Delete all UserProgress entries
    console.log('Cleaning UserProgress collection...');
    const progressDeleteResult = await UserProgress.deleteMany({});
    console.log(`Deleted ${progressDeleteResult.deletedCount} UserProgress documents.`);

    // 3. Delete all Leaderboard entries
    console.log('Cleaning Leaderboard collection...');
    const leaderboardDeleteResult = await Leaderboard.deleteMany({});
    console.log(`Deleted ${leaderboardDeleteResult.deletedCount} Leaderboard documents.`);

    // Print active super admins
    const remainingAdmins = await User.find({});
    console.log('\n--- Active Super Admins Remaining in DB ---');
    remainingAdmins.forEach(admin => {
      console.log(`- ID: ${admin.id} | Name: ${admin.name} | Role: ${admin.role} | Email: ${admin.email}`);
    });
    console.log('-------------------------------------------\n');

    console.log('Database cleanup completed successfully.');

  } catch (err) {
    console.error('An error occurred during database cleanup:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

cleanDatabase();
