import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import { VALID_DOMAINS } from '../config/constants.js';
import { authenticateToken } from '../middleware/auth.js';
import authLimiter from '../middleware/authLimiter.js';
import { sendWelcomeEmail, sendVerificationEmail } from '../config/mailer.js';

const router = express.Router();

// Register
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, domains } = req.body;

  if (!name || !email || !password || !domains) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // 1. Strict email validation
  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ message: 'Only @gmail.com emails are allowed.' });
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
    
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Generate OTP & Link token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingUser && !existingUser.isVerified) {
      // Update unverified user registration details
      existingUser.name = name;
      existingUser.passwordHash = passwordHash;
      existingUser.domains = domains;
      existingUser.verificationOtp = otp;
      existingUser.verificationOtpExpires = otpExpires;
      existingUser.verificationToken = token;
      existingUser.verificationTokenExpires = tokenExpires;
      existingUser.tempPassword = password;
      await existingUser.save();
    } else {
      // Create new user (inactive)
      await User.create({
        id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        passwordHash,
        domains,
        isVerified: false,
        verificationOtp: otp,
        verificationOtpExpires: otpExpires,
        verificationToken: token,
        verificationTokenExpires: tokenExpires,
        tempPassword: password,
        role: 'user',
        adminDomains: [],
        createdAt: new Date().toISOString()
      });
    }

    // Send verification email (OTP and link)
    try {
      await sendVerificationEmail(email.toLowerCase(), name, otp, token);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(201).json({ 
      message: 'Verification email sent. Please check your inbox.',
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
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

    // Block unverified accounts
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.', 
        unverified: true, 
        email: user.email 
      });
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

// Verify OTP Endpoint
router.post('/verify-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP code are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    if (!user.verificationOtp || user.verificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (new Date() > new Date(user.verificationOtpExpires)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Mark user as active
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    const plainPassword = user.tempPassword;
    user.tempPassword = undefined;
    await user.save();

    // Create leaderboard entries for selected domains
    const leaderboardEntries = [];
    for (const domain of user.domains) {
      const exists = await Leaderboard.findOne({ userId: user.id, domain });
      if (!exists) {
        const domainCount = await Leaderboard.countDocuments({ domain });
        leaderboardEntries.push({
          id: `lb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: user.id,
          userName: user.name,
          domain,
          scores: {},
          totalScore: 0,
          rank: domainCount + 1
        });
      }
    }
    if (leaderboardEntries.length > 0) {
      await Leaderboard.insertMany(leaderboardEntries);
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, user.domains, plainPassword);
    } catch (emailErr) {
      console.error('Welcome email dispatch failed after OTP verification:', emailErr);
    }

    // Generate JWT login session
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
      message: 'Account activated successfully!',
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
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error during OTP verification.' });
  }
});

// Verify Link Endpoint
router.post('/verify-link', authLimiter, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required.' });
  }

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    if (new Date() > new Date(user.verificationTokenExpires)) {
      return res.status(400).json({ message: 'Verification link has expired. Please request a new code.' });
    }

    // Mark user as active
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    const plainPassword = user.tempPassword;
    user.tempPassword = undefined;
    await user.save();

    // Create leaderboard entries for selected domains
    const leaderboardEntries = [];
    for (const domain of user.domains) {
      const exists = await Leaderboard.findOne({ userId: user.id, domain });
      if (!exists) {
        const domainCount = await Leaderboard.countDocuments({ domain });
        leaderboardEntries.push({
          id: `lb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: user.id,
          userName: user.name,
          domain,
          scores: {},
          totalScore: 0,
          rank: domainCount + 1
        });
      }
    }
    if (leaderboardEntries.length > 0) {
      await Leaderboard.insertMany(leaderboardEntries);
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, user.domains, plainPassword);
    } catch (emailErr) {
      console.error('Welcome email dispatch failed after link verification:', emailErr);
    }

    // Generate JWT login session
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domains: user.domains,
      adminDomains: user.adminDomains
    };

    const jwtSecret = process.env.JWT_SECRET;
    const jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

    res.json({
      message: 'Account activated successfully!',
      token: jwtToken,
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
    console.error('Link verification error:', error);
    res.status(500).json({ message: 'Internal server error during link verification.' });
  }
});

// Resend OTP Endpoint
router.post('/resend-otp', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please log in.' });
    }

    // Generate new OTP and token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;
    user.verificationToken = token;
    user.verificationTokenExpires = tokenExpires;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, otp, token);
    } catch (emailErr) {
      console.error('Resend verification email failed:', emailErr);
      return res.status(500).json({ message: 'Failed to send verification email.' });
    }

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
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
