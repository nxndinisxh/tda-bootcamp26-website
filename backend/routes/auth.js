import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import { VALID_DOMAINS } from '../config/constants.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, domains } = req.body;

  if (!name || !email || !password || !domains) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // 1. Strict email validation
  if (!email.endsWith('@learner.manipal.edu')) {
    return res.status(400).json({ message: 'Only university emails ending with @learner.manipal.edu are allowed.' });
  }

  // 2. Validate domains
  if (!Array.isArray(domains) || domains.length < 1 || domains.length > 3) {
    return res.status(400).json({ message: 'You must select between 1 and 3 domains.' });
  }

  const invalidDomains = domains.filter(d => !VALID_DOMAINS.includes(d));
  if (invalidDomains.length > 0) {
    return res.status(400).json({ message: `Invalid domain selected: ${invalidDomains.join(', ')}` });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      id: `user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      domains,
      role: 'user',
      adminDomains: [],
      createdAt: new Date().toISOString()
    });

    // Create leaderboard entries
    const leaderboardEntries = [];
    for (const domain of domains) {
      const domainCount = await Leaderboard.countDocuments({ domain });
      leaderboardEntries.push({
        id: `lb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: newUser.id,
        userName: newUser.name,
        domain,
        scores: {},
        totalScore: 0,
        rank: domainCount + 1
      });
    }
    await Leaderboard.insertMany(leaderboardEntries);

    res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domains: user.domains,
      adminDomains: user.adminDomains
    };

    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

    res.json({
      token,
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domains: user.domains,
      adminDomains: user.adminDomains
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
