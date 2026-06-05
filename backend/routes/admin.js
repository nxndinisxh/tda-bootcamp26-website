import express from 'express';
import { Readable } from 'stream';
import csv from 'csv-parser';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import csvUpload from '../middleware/csvUpload.js';
import { VALID_DOMAINS } from '../config/constants.js';
import { authenticateToken, requireRole, requireDomainAccess } from '../middleware/auth.js';

const router = express.Router();

// List all users
router.get('/users', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// Update user role and admin domains (Super Admin only)
router.put('/users/:id/role', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const { role, adminDomains } = req.body;

  if (!role) {
    return res.status(400).json({ message: 'Role is required.' });
  }

  if (role === 'admin' && (!adminDomains || !Array.isArray(adminDomains))) {
    return res.status(400).json({ message: 'For admin role, adminDomains array is required.' });
  }

  try {
    const user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.email === 'admin@learner.manipal.edu' && role !== 'super_admin') {
      return res.status(400).json({ message: 'The primary Super Admin account cannot be demoted.' });
    }

    user.role = role;
    user.adminDomains = role === 'admin' ? adminDomains : (role === 'super_admin' ? VALID_DOMAINS : []);
    await user.save();

    res.json({
      message: 'User role updated successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        domains: user.domains,
        adminDomains: user.adminDomains
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role.' });
  }
});

// Parse CSV buffer helper
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

// Upload Weekly Leaderboard CSV
router.post('/leaderboards/weekly', authenticateToken, csvUpload.single('csvFile'), requireDomainAccess(req => req.body.domain), async (req, res) => {
  const { domain, weekNumber } = req.body;

  if (!domain || !weekNumber) {
    return res.status(400).json({ message: 'Domain and weekNumber are required.' });
  }

  const parsedWeek = Number(weekNumber);
  if (isNaN(parsedWeek)) {
    return res.status(400).json({ message: 'weekNumber must be a valid number.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'CSV file is required.' });
  }

  try {
    const rows = await parseCSV(req.file.buffer);
    
    const documents = [];
    const errors = [];
    let uploadedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rankVal = row['rank'];
      const regNoVal = row['reg no'] || row['regno'] || row['registration number'];
      const pointsVal = row['points'] || row['score'] || row['total'];
      const nameVal = row['name'] || row['participant'] || row['student name'] || row['student_name'];

      if (!rankVal || !regNoVal || pointsVal === undefined) {
        errors.push(`Row ${i + 2}: Missing required fields (Rank, Reg no, or Points).`);
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

      const scoreNum = Number(pointsVal);
      const rankNum = Number(rankVal);

      if (isNaN(scoreNum) || isNaN(rankNum)) {
        errors.push(`Row ${i + 2}: Rank (${rankVal}) or Points (${pointsVal}) is not a number.`);
        skippedCount++;
        continue;
      }

      documents.push({
        userId: user.id,
        userName: user.name,
        domain,
        leaderboardType: 'weekly',
        weekNumber: parsedWeek,
        score: scoreNum,
        originalIndex: i,
        uploadedAt: new Date()
      });
      uploadedCount++;
    }

    // Sort documents by score descending, preserving original CSV order for ties
    documents.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.originalIndex - b.originalIndex;
    });

    // Calculate dense ranks
    let currentRank = 0;
    let currentScore = -1;
    for (let i = 0; i < documents.length; i++) {
      if (documents[i].score !== currentScore) {
        currentRank++;
        currentScore = documents[i].score;
      }
      documents[i].rank = currentRank;
      delete documents[i].originalIndex;
    }

    // Delete existing weekly data for this week and domain
    await Leaderboard.deleteMany({
      domain,
      leaderboardType: 'weekly',
      weekNumber: parsedWeek
    });

    if (documents.length > 0) {
      await Leaderboard.insertMany(documents);
    }

    res.json({
      success: true,
      uploaded: uploadedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Weekly leaderboard upload error:', error);
    res.status(500).json({ message: 'Failed to process CSV file.', error: error.message });
  }
});

// Upload Overall Leaderboard CSV
router.post('/leaderboards/overall', authenticateToken, csvUpload.single('csvFile'), requireDomainAccess(req => req.body.domain), async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ message: 'Domain is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'CSV file is required.' });
  }

  try {
    const rows = await parseCSV(req.file.buffer);

    const documents = [];
    const errors = [];
    let uploadedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rankVal = row['rank'];
      const regNoVal = row['reg no'] || row['regno'] || row['registration number'];
      const totalVal = row['total'] || row['points'] || row['score'];
      const nameVal = row['name'] || row['participant'] || row['student name'] || row['student_name'];

      if (!rankVal || !regNoVal || totalVal === undefined) {
        errors.push(`Row ${i + 2}: Missing required fields (Rank, Reg no, or Total).`);
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

      const scoreNum = Number(totalVal);
      const rankNum = Number(rankVal);

      if (isNaN(scoreNum) || isNaN(rankNum)) {
        errors.push(`Row ${i + 2}: Rank (${rankVal}) or Total (${totalVal}) is not a number.`);
        skippedCount++;
        continue;
      }

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

      documents.push({
        userId: user.id,
        userName: user.name,
        domain,
        leaderboardType: 'overall',
        score: scoreNum,
        weeklyBreakdown,
        originalIndex: i,
        uploadedAt: new Date()
      });
      uploadedCount++;
    }

    // Sort documents by score descending, preserving original CSV order for ties
    documents.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.originalIndex - b.originalIndex;
    });

    // Calculate dense ranks
    let currentRank = 0;
    let currentScore = -1;
    for (let i = 0; i < documents.length; i++) {
      if (documents[i].score !== currentScore) {
        currentRank++;
        currentScore = documents[i].score;
      }
      documents[i].rank = currentRank;
      delete documents[i].originalIndex;
    }

    // Delete existing overall data for that domain
    await Leaderboard.deleteMany({
      domain,
      leaderboardType: 'overall'
    });

    if (documents.length > 0) {
      await Leaderboard.insertMany(documents);
    }

    res.json({
      success: true,
      uploaded: uploadedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Overall leaderboard upload error:', error);
    res.status(500).json({ message: 'Failed to process CSV file.', error: error.message });
  }
});

export default router;
