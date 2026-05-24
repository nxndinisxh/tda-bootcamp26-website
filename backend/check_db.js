import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import mongoose from 'mongoose';
import Leaderboard from './models/Leaderboard.js';
import User from './models/User.js';

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const lbs = await Leaderboard.find({});
    console.log('Total Leaderboards:', lbs.length);
    console.log(lbs);
    const users = await User.find({});
    console.log('Total Users:', users.length);
    console.log(users);
    process.exit(0);
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });
