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

const createSuperAdmin = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing from environment variables!');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    // Check if user already exists
    let user = await User.findOne({ id: '240905552' });
    if (user) {
      console.log('User 240905552 already exists. Updating role to super_admin...');
      user.name = 'nandini';
      user.email = 'goodnandini@gmail.com';
      user.passwordHash = passwordHash;
      user.role = 'super_admin';
      user.domains = ['DSA', 'DAV', 'AI ML', 'Gen Ai', 'WebDev'];
      user.adminDomains = ['DSA', 'DAV', 'AI ML', 'Gen Ai', 'WebDev'];
      user.isVerified = true;
      user.isFirstLogin = false;
      await user.save();
      console.log('Superadmin updated successfully.');
    } else {
      console.log('Creating new Superadmin: 240905552 (nandini)...');
      await User.create({
        id: '240905552',
        name: 'nandini',
        email: 'goodnandini@gmail.com',
        passwordHash,
        domains: ['DSA', 'DAV', 'AI ML', 'Gen Ai', 'WebDev'],
        role: 'super_admin',
        adminDomains: ['DSA', 'DAV', 'AI ML', 'Gen Ai', 'WebDev'],
        isVerified: true,
        isFirstLogin: false,
        createdAt: new Date().toISOString()
      });
      console.log('Superadmin created successfully.');
    }

  } catch (err) {
    console.error('Error creating super admin:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

createSuperAdmin();
