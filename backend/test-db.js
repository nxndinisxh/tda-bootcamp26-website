import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("MONGO_URI inside test script:", process.env.MONGO_URI);

const test = async () => {
  try {
    await connectDB();
    console.log("SUCCESS: Database connection established successfully!");
    process.exit(0);
  } catch (err) {
    console.error("FAILURE: Database connection failed!");
    console.error(err);
    process.exit(1);
  }
};

test();
