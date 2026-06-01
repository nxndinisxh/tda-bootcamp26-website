import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const onboardUsers = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing from environment variables!');
    process.exit(1);
  }

  // Find CSV file path
  let csvPath = path.join(__dirname, '../TDA Bootcamp \'26.xlsx - Sheet1.csv');
  if (!fs.existsSync(csvPath)) {
    csvPath = path.join(__dirname, 'TDA Bootcamp \'26.xlsx - Sheet1.csv');
  }
  if (!fs.existsSync(csvPath)) {
    // Check if there is any other CSV file in the root directory
    try {
      const rootFiles = fs.readdirSync(path.join(__dirname, '../'));
      const csvFile = rootFiles.find(f => f.endsWith('.csv'));
      if (csvFile) {
        csvPath = path.join(__dirname, '../', csvFile);
      }
    } catch (e) {
      // Ignore directory read errors
    }
  }

  if (!fs.existsSync(csvPath)) {
    console.error('Could not find the onboarding CSV file!');
    process.exit(1);
  }

  console.log(`Found CSV file at: ${csvPath}`);

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      console.error('CSV file is empty or has no data rows.');
      process.exit(1);
    }

    const headers = lines[0].split(',').map(h => h.trim());
    console.log('CSV Headers:', headers);

      let createdCount = 0;
      let updatedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(val => val.trim());
        if (row.length < headers.length) continue;

        const record = {};
        headers.forEach((header, idx) => {
          record[header] = row[idx];
        });

        const email = record['Email']?.toLowerCase();
        const name = record['Full Name'];
        const regNo = record['Registration Number'];
        const tempPassword = record['Password'];

        if (!email || !name || !regNo || !tempPassword) {
          console.warn(`Row ${i} is missing required fields, skipping.`);
          continue;
        }

        // Map domains to valid database constants
        const domains = [];
        if (record['DSA'] === 'Yes') domains.push('DSA');
        if (record['DAV'] === 'Yes') domains.push('DAV');
        if (record['WebDev'] === 'Yes') domains.push('WebDev'); // Mapped to WebDev
        if (record['AIML'] === 'Yes') domains.push('ML/DL');
        if (record['GEN AI'] === 'Yes') domains.push('Gen & Agentic AI');

        if (domains.length === 0) {
          console.warn(`User ${name} has no selected domains, skipping.`);
          continue;
        }

        // Check if user already exists in database
        const existingUser = await User.findOne({ id: regNo });
        if (existingUser) {
          console.log(`User ${regNo} (${name}) already exists. Updating enrolled domains and profile details...`);
          existingUser.domains = domains;
          existingUser.name = name;
          existingUser.email = email;
          await existingUser.save();
          updatedCount++;
          continue;
        }

        // Hash password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPassword, salt);

        console.log(`Creating new user: ${regNo} (${name})...`);
        await User.create({
          id: regNo,
          name,
          email,
          passwordHash,
          domains,
          isVerified: true,
          isFirstLogin: true,
          role: 'user',
          adminDomains: [],
          createdAt: new Date().toISOString()
        });
        createdCount++;
      }

      console.log(`Successfully completed onboarding task: Created ${createdCount} new users, Updated ${updatedCount} existing users.`);
    } catch (err) {
    console.error('Error during onboarding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

onboardUsers();
