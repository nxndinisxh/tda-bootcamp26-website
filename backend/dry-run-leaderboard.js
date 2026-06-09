import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase()
      }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
};

async function runDryRun() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node backend/dry-run-leaderboard.js <csv-file-path> <type: weekly|overall> <domain> [week-number]');
    process.exit(1);
  }

  const [csvPath, type, domain, weekNumber] = args;

  if (type !== 'weekly' && type !== 'overall') {
    console.error('Error: Leaderboard type must be either "weekly" or "overall"');
    process.exit(1);
  }

  if (type === 'weekly' && !weekNumber) {
    console.error('Error: weekNumber is required for weekly leaderboard');
    process.exit(1);
  }

  const parsedWeek = type === 'weekly' ? Number(weekNumber) : null;
  if (type === 'weekly' && isNaN(parsedWeek)) {
    console.error('Error: weekNumber must be a valid number');
    process.exit(1);
  }

  const absoluteCsvPath = path.resolve(csvPath);
  if (!fs.existsSync(absoluteCsvPath)) {
    console.error(`Error: CSV file not found at ${absoluteCsvPath}`);
    process.exit(1);
  }

  console.log(`\n=== Starting Dry Run for ${type.toUpperCase()} Leaderboard ===`);
  console.log(`CSV Path: ${absoluteCsvPath}`);
  console.log(`Domain:   ${domain}`);
  if (type === 'weekly') {
    console.log(`Week:     ${parsedWeek}`);
  }

  console.log('Connecting to database...');
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is missing from environment variables');
    process.exit(1);
  }

  // Connect directly without running migrations
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  try {
    const fileBuffer = fs.readFileSync(absoluteCsvPath);
    const rows = await parseCSV(fileBuffer);
    console.log(`Successfully parsed CSV. Found ${rows.length} rows.\n`);

    const documents = [];
    const errors = [];
    let uploadedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rankVal = row['rank'];
      const regNoVal = row['reg no'] || row['regno'] || row['registration number'];
      
      let scoreVal;
      if (type === 'weekly') {
        scoreVal = row['points'] || row['score'] || row['total'];
      } else {
        scoreVal = row['total'] || row['points'] || row['score'];
      }
      
      const nameVal = row['name'] || row['participant'] || row['student name'] || row['student_name'];

      if (!rankVal || !regNoVal || scoreVal === undefined) {
        errors.push(`Row ${i + 2}: Missing required fields (Rank, Reg no, or Points/Total). Available fields: ${JSON.stringify(Object.keys(row))}`);
        skippedCount++;
        continue;
      }

      // Convert regNoVal to string and handle scientific notation
      const originalRegNo = String(regNoVal).trim();
      let normalizedRegNo = originalRegNo;
      if (normalizedRegNo.includes('e') || normalizedRegNo.includes('E')) {
        const num = Number(normalizedRegNo);
        if (!isNaN(num)) {
          normalizedRegNo = num.toFixed(0);
        }
      }

      // Verify User Exists
      let user = await User.findOne({ id: normalizedRegNo });
      if (!user && nameVal) {
        const trimmedName = String(nameVal).trim();
        user = await User.findOne({ name: { $regex: new RegExp('^' + trimmedName + '$', 'i') } });
      }

      if (!user) {
        errors.push(`Row ${i + 2}: Student with Reg no '${originalRegNo}'${nameVal ? ` or Name '${nameVal}'` : ''} not found in database.`);
        skippedCount++;
        continue;
      }

      const scoreNum = Number(scoreVal);
      const rankNum = Number(rankVal);

      if (isNaN(scoreNum) || isNaN(rankNum)) {
        errors.push(`Row ${i + 2}: Rank (${rankVal}) or Score/Total (${scoreVal}) is not a number.`);
        skippedCount++;
        continue;
      }

      const doc = {
        userId: user.id,
        userName: user.name,
        domain,
        leaderboardType: type,
        score: scoreNum,
        rank: rankNum, // Keep CSV rank!
        originalIndex: i,
        uploadedAt: new Date()
      };

      if (type === 'weekly') {
        doc.weekNumber = parsedWeek;
      } else {
        // Extract weeklyBreakdown from columns: points week 1, points week 2, points week 3...
        const weeklyBreakdown = {};
        for (const key of Object.keys(row)) {
          const match = key.match(/points\s+week\s+(\d+)/i) || key.match(/week\s+(\d+)/i);
          if (match) {
            const weekNum = match[1];
            const pts = parseFloat(row[key]);
            if (!isNaN(pts)) {
              weeklyBreakdown[`week${weekNum}`] = pts;
            }
          }
        }
        doc.weeklyBreakdown = weeklyBreakdown;
      }

      documents.push(doc);
      uploadedCount++;
    }

    // Sort documents by rank ascending, preserving original CSV order if ranks are equal
    documents.sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.originalIndex - b.originalIndex;
    });

    // Clean up originalIndex
    for (let i = 0; i < documents.length; i++) {
      delete documents[i].originalIndex;
    }

    console.log('=== DRY RUN RESULTS ===');
    console.log(`Successfully matched: ${uploadedCount} / ${rows.length}`);
    console.log(`Skipped (with errors): ${skippedCount} / ${rows.length}\n`);

    if (errors.length > 0) {
      console.log('--- Errors/Skipped Rows ---');
      errors.forEach(err => console.log(`[WARNING] ${err}`));
      console.log();
    }

    console.log('--- Computed Database Payload Preview ---');
    if (documents.length === 0) {
      console.log('No documents would be inserted.');
    } else {
      console.table(documents.map(doc => ({
        Rank: doc.rank,
        'Reg No': doc.userId,
        Name: doc.userName,
        Score: doc.score,
        ...(type === 'weekly' ? { Week: doc.weekNumber } : { Breakdown: JSON.stringify(doc.weeklyBreakdown) })
      })));
    }

    console.log('\n[SUCCESS] Dry run completed. Database was NOT modified.');

  } catch (error) {
    console.error('Error during dry run execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runDryRun();
