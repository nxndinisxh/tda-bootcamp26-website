import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Dummy users with access to ALL domains
const dummyUsers = [
  {
    id: '240968178',
    name: 'Umar Siddique',
    email: 'umarsiddique2601@gmail.com'
  },
  {
    id: '240968508',
    name: 'Adi Shree',
    email: 'adi.mitmpl2024@learner.manipal.edu'
  }
];

const ALL_DOMAINS = ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'];

const createDummyUsers = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const salt = await bcrypt.genSalt(10);

    for (const dummy of dummyUsers) {
      const passwordHash = await bcrypt.hash(dummy.id, salt);

      let user = await User.findOne({ id: dummy.id });

      if (user) {
        console.log(`Updating ${dummy.name} (${dummy.id})...`);
        user.name = dummy.name;
        user.email = dummy.email;
        user.passwordHash = passwordHash;
        user.role = 'user';
        user.domains = ALL_DOMAINS;
        user.adminDomains = [];
        user.isVerified = true;
        user.isFirstLogin = true;
        await user.save();
        console.log(`${dummy.name} updated successfully.`);
      } else {
        console.log(`Creating ${dummy.name} (${dummy.id})...`);
        await User.create({
          id: dummy.id,
          name: dummy.name,
          email: dummy.email,
          passwordHash,
          domains: ALL_DOMAINS,
          role: 'user',
          adminDomains: [],
          isVerified: true,
          isFirstLogin: true,
          createdAt: new Date().toISOString()
        });
        console.log(`${dummy.name} created successfully.`);
      }
    }

    console.log('Done creating dummy users.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

createDummyUsers();
