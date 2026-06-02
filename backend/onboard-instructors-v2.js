import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import { VALID_DOMAINS } from './config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const onboardInstructors = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing from environment variables!');
    process.exit(1);
  }

  // Find CSV file path
  let csvPath = path.join(__dirname, '../Instructor Details (1) (quillbot.com).csv');
  if (!fs.existsSync(csvPath)) {
    csvPath = path.join(__dirname, 'Instructor Details (1) (quillbot.com).csv');
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`Could not find the onboarding CSV file at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Found CSV file at: ${csvPath}`);

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database.');

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
      console.error('CSV file is empty or has no data rows.');
      process.exit(1);
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    console.log('CSV Headers parsed:', headers);

    // Dynamic columns selection
    const nameHeader = headers.find(h => h.toLowerCase() === 'name1') || headers.find(h => h.toLowerCase().includes('name')) || headers[0];
    const regNoHeader = headers.find(h => h.toLowerCase().includes('registration')) || headers.find(h => h.toLowerCase().includes('reg')) || headers[1];
    const emailHeader = headers.find(h => h.toLowerCase() === 'email1') || headers.find(h => h.toLowerCase().includes('email')) || headers[2];
    const domainHeader = headers.find(h => h.toLowerCase().includes('domain')) || headers[3];

    console.log('Mapped Column Headers:');
    console.log(`- Name Column: "${nameHeader}"`);
    console.log(`- Registration Number Column: "${regNoHeader}"`);
    console.log(`- Email Column: "${emailHeader}"`);
    console.log(`- Domain Column: "${domainHeader}"`);

    const summary = [];
    const salt = await bcrypt.genSalt(10);

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

      const record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] ? row[idx].trim() : '';
      });

      let regNo = record[regNoHeader];
      let name = record[nameHeader];
      let email = record[emailHeader]?.toLowerCase();
      let domainStr = record[domainHeader];

      if (!regNo || !name || !email) {
        console.warn(`Row ${i + 1} is missing required fields (RegNo: ${regNo}, Name: ${name}, Email: ${email}), skipping.`);
        continue;
      }

      // Convert scientific notation if present (e.g. 2.5109E+11)
      if (regNo.toLowerCase().includes('e')) {
        const numVal = Number(regNo);
        if (!isNaN(numVal)) {
          const normalRegNo = numVal.toLocaleString('fullwide', { useGrouping: false });
          console.log(`Note: Converted scientific notation ID "${regNo}" to "${normalRegNo}" for ${name}`);
          regNo = normalRegNo;
        }
      }

      // Map domains
      const instructorDomains = [];
      if (domainStr) {
        const splitDomains = domainStr.split(',').map(d => d.trim()).filter(Boolean);
        splitDomains.forEach(d => {
          let mapped = d;
          if (d === 'AIML') mapped = 'ML/DL';
          if (d === 'GEN AI') mapped = 'Gen & Agentic AI';
          
          if (VALID_DOMAINS.includes(mapped)) {
            instructorDomains.push(mapped);
          } else {
            console.warn(`Skipping invalid/unknown domain "${d}" (mapped: "${mapped}") for ${name}`);
          }
        });
      }

      // Check if user exists
      let user = await User.findOne({ id: regNo });

      if (user) {
        console.log(`User ${regNo} (${name}) already exists. Upgrading/Updating to Admin...`);
        user.role = 'admin';

        // Merge domains
        const domainsSet = new Set([...user.domains, ...instructorDomains]);
        user.domains = Array.from(domainsSet);

        const adminDomainsSet = new Set([...user.adminDomains, ...instructorDomains]);
        user.adminDomains = Array.from(adminDomainsSet);

        user.name = name;
        user.email = email;

        await user.save();
        summary.push({
          status: 'UPDATED',
          id: regNo,
          name,
          email,
          domains: user.adminDomains.join(', '),
          password: '(Existing Password)'
        });
      } else {
        console.log(`Creating new Admin User ${regNo} (${name})...`);
        const tempPassword = `TDAInstructor@${regNo}`;
        const passwordHash = await bcrypt.hash(tempPassword, salt);

        await User.create({
          id: regNo,
          name,
          email,
          passwordHash,
          tempPassword: tempPassword,
          domains: instructorDomains,
          role: 'admin',
          adminDomains: instructorDomains,
          isVerified: true,
          isFirstLogin: false,
          createdAt: new Date().toISOString()
        });

        summary.push({
          status: 'CREATED',
          id: regNo,
          name,
          email,
          domains: instructorDomains.join(', '),
          password: tempPassword
        });
      }
    }

    console.log('\n=========================================');
    console.log('        ONBOARDING STATUS REPORT         ');
    console.log('=========================================');
    console.table(summary);
    console.log('=========================================\n');

  } catch (err) {
    console.error('Error during instructor onboarding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

onboardInstructors();
