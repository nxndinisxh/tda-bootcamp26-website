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

const fixKuldeep = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database.');

    const oldId = '251090000000';
    const newId = '251090052182';

    // Check if newId already exists
    let existingNew = await User.findOne({ id: newId });
    // Check if oldId exists
    let existingOld = await User.findOne({ id: oldId });

    if (existingOld) {
      if (existingNew) {
        console.log(`Both ${oldId} and ${newId} exist. Deleting the incorrect entry ${oldId}...`);
        await User.deleteOne({ id: oldId });
      } else {
        console.log(`Updating user ID from ${oldId} to ${newId}...`);
        existingOld.id = newId;
        
        // Rehash password for new ID to match TDAInstructor@251090052182
        const salt = await bcrypt.genSalt(10);
        const tempPassword = `TDAInstructor@${newId}`;
        existingOld.passwordHash = await bcrypt.hash(tempPassword, salt);
        existingOld.tempPassword = tempPassword;
        
        await existingOld.save();
        console.log(`User updated successfully.`);
      }
    } else if (!existingNew) {
      console.log(`Creating user ${newId} directly...`);
      const salt = await bcrypt.genSalt(10);
      const tempPassword = `TDAInstructor@${newId}`;
      const passwordHash = await bcrypt.hash(tempPassword, salt);
      
      await User.create({
        id: newId,
        name: 'Kuldeepkumar R Bhurani',
        email: 'myappledoorvaults@gmail.com',
        passwordHash,
        tempPassword: tempPassword,
        domains: ['WebDev'],
        role: 'admin',
        adminDomains: ['WebDev'],
        isVerified: true,
        isFirstLogin: false,
        createdAt: new Date().toISOString()
      });
      console.log(`User created successfully.`);
    } else {
      console.log(`User with ID ${newId} already exists and old ID ${oldId} is not in the database.`);
    }

  } catch (err) {
    console.error('Error fixing Kuldeep:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

fixKuldeep();
