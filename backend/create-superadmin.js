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

const superAdmins = [
  {
    id: '240905552',
    name: 'nandini',
    email: 'goodnandini@gmail.com'
  },
  {
    id: '240911088',
    name: 'muizz',
    email: 'mmdmuizzahmed.09.a@gmail.com'
  },
  {
    id: '240905400',
    name: 'mitul',
    email: 'Mitul141@gmail.com'
  }
];

const createSuperAdmin = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const salt = await bcrypt.genSalt(10);

    for (const admin of superAdmins) {
      const passwordHash = await bcrypt.hash('Wisdom@786', salt);

      let user = await User.findOne({ id: admin.id });

      if (user) {
        console.log(`Updating ${admin.name}...`);

        user.name = admin.name;
        user.email = admin.email;
        user.passwordHash = passwordHash;
        user.role = 'super_admin';
        user.domains = ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'];
        user.adminDomains = ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'];
        user.isVerified = true;
        user.isFirstLogin = false;

        await user.save();

        console.log(`${admin.name} updated successfully.`);
      } else {
        console.log(`Creating ${admin.name}...`);

        await User.create({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          passwordHash,
          domains: ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'],
          role: 'super_admin',
          adminDomains: ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'],
          isVerified: true,
          isFirstLogin: false,
          createdAt: new Date().toISOString()
        });

        console.log(`${admin.name} created successfully.`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

createSuperAdmin();
