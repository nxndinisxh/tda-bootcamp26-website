import express from 'express';
import { Readable } from 'stream';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Resource from '../models/Resource.js';
import UserProgress from '../models/UserProgress.js';
import WeekLock from '../models/WeekLock.js';
import csvUpload from '../middleware/csvUpload.js';
import { VALID_DOMAINS, getEquivalentDomains } from '../config/constants.js';
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
        rank: rankNum, // Keep CSV rank!
        originalIndex: i,
        uploadedAt: new Date()
      });
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
        rank: rankNum, // Keep CSV rank!
        weeklyBreakdown,
        originalIndex: i,
        uploadedAt: new Date()
      });
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

// GET user detailed progress profile
router.get('/users/:id/progress', authenticateToken, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const progressData = [];
    for (const domain of user.domains) {
      const equivalentDomains = getEquivalentDomains(domain);
      
      const resources = await Resource.find({ domain: { $in: equivalentDomains } }).sort({ week: 1, order: 1 });
      const locks = await WeekLock.find({ domain: { $in: equivalentDomains } });
      const lockMap = {};
      locks.forEach(l => {
        lockMap[l.week] = l.isLocked;
      });

      const resourceProgressList = [];
      let completedCount = 0;
      let totalUnlocked = 0;

      for (const resItem of resources) {
        const isLocked = lockMap[resItem.week] !== false;
        if (!isLocked) {
          totalUnlocked++;
        }

        const progress = await UserProgress.findOne({
          userId: user.id,
          resourceId: resItem.id
        });

        const isCompleted = progress ? progress.completed : false;
        if (isCompleted && !isLocked) {
          completedCount++;
        }

        resourceProgressList.push({
          id: resItem.id,
          title: resItem.title,
          week: resItem.week,
          isLocked,
          completed: isCompleted
        });
      }

      progressData.push({
        domain,
        completed: completedCount,
        total: totalUnlocked,
        percentage: totalUnlocked > 0 ? Math.round((completedCount / totalUnlocked) * 100) : 0,
        resources: resourceProgressList
      });
    }

    res.json({ progress: progressData });
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    res.status(500).json({ message: 'Failed to fetch user progress' });
  }
});

// Manual user creation / onboarding (Super Admin only)
router.post('/users/onboard', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id, name, email, domains, role, adminDomains, password } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({ message: 'Registration number (ID), Name, and Email are required.' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ id: id.trim() }, { email: email.trim().toLowerCase() }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this Registration Number or Email already exists.' });
    }

    const defaultPassword = password || 'manipal123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const newUser = new User({
      id: id.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      isVerified: true,
      isFirstLogin: true,
      domains: domains || [],
      role: role || 'user',
      adminDomains: role === 'admin' ? (adminDomains || []) : (role === 'super_admin' ? VALID_DOMAINS : [])
    });

    await newUser.save();

    res.status(201).json({
      message: 'User onboarded successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        domains: newUser.domains,
        adminDomains: newUser.adminDomains
      }
    });
  } catch (error) {
    console.error('Onboard user error:', error);
    res.status(500).json({ message: 'Failed to onboard user.', error: error.message });
  }
});

// Edit user profile details (Super Admin only)
router.put('/users/:id/profile', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const { name, email, domains } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (domains) user.domains = domains;

    await user.save();

    res.json({
      message: 'User profile updated successfully.',
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
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Failed to update user profile.' });
  }
});

// Reset user password (Super Admin only)
router.put('/users/:id/reset-password', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const { password, forceFirstLogin } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    if (forceFirstLogin !== undefined) {
      user.isFirstLogin = forceFirstLogin;
    }

    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
});

// Delete user account (Super Admin only)
router.delete('/users/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.email === 'admin@learner.manipal.edu') {
      return res.status(400).json({ message: 'The primary Super Admin account cannot be deleted.' });
    }

    await User.deleteOne({ id });
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

export default router;
