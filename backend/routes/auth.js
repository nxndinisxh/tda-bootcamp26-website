import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import { VALID_DOMAINS } from '../config/constants.js';
import { authenticateToken } from '../middleware/auth.js';
import authLimiter from '../middleware/authLimiter.js';
import { sendWelcomeEmail, sendVerificationEmail } from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Register (Disabled in favor of CSV onboarding)
router.post('/register', authLimiter, async (req, res) => {
  return res.status(403).json({ message: 'Self-registration is disabled. Accounts are pre-created.' });
});

// Login (Using registration number as userId)
router.post('/login', authLimiter, async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: 'Registration Number and password are required' });
  }

  try {
    const user = await User.findOne({ id: userId.trim() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid Registration Number or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Registration Number or password.' });
    }

    // Block unverified accounts
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.', 
        unverified: true, 
        email: user.email 
      });
    }

    // First login check -> force password reset (except for admin/super_admin)
    if (user.isFirstLogin && user.role !== 'admin' && user.role !== 'super_admin') {
      return res.json({
        isFirstLogin: true,
        userId: user.id,
        message: 'First login detected. Password reset is required.'
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

// Reset Password (and log plain password in CSV)
router.post('/reset-password', authLimiter, async (req, res) => {
  const { userId, tempPassword, newPassword } = req.body;

  if (!userId || !tempPassword || !newPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const user = await User.findOne({ id: userId.trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify the temporary/previous password
    const isMatch = await bcrypt.compare(tempPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid temporary password.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.isFirstLogin = false;
    await user.save();

    // Log the new real password into a new CSV file
    try {
      const csvFilePath = path.join(__dirname, '../updated_passwords.csv');
      if (!fs.existsSync(csvFilePath)) {
        fs.writeFileSync(csvFilePath, 'Reg No,Name,Email,New Password,Reset At\n', 'utf8');
      }
      
      const escapedName = `"${user.name.replace(/"/g, '""')}"`;
      const escapedEmail = `"${user.email.replace(/"/g, '""')}"`;
      const escapedPassword = `"${newPassword.replace(/"/g, '""')}"`;
      const row = `${user.id},${escapedName},${escapedEmail},${escapedPassword},${new Date().toISOString()}\n`;
      fs.appendFileSync(csvFilePath, row, 'utf8');
      console.log(`Password reset logged for user ${user.id} to updated_passwords.csv`);
    } catch (csvErr) {
      console.error('Failed to log updated password to CSV file:', csvErr);
    }

    // Automatically initialize leaderboard entries for their domains if they don't exist yet
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

    // Send a welcome mail confirming activation (includes username, email, domains)
    try {
      await sendWelcomeEmail(user.email, user.name, user.domains);
    } catch (emailErr) {
      console.error('Failed to send welcome email after password reset:', emailErr);
    }

    // Log in automatically by generating a JWT session
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
      message: 'Password reset successfully!',
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
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error during password reset.' });
  }
});

// Verify OTP Endpoint (for legacy logins if any)
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

// Verify Link Endpoint (for legacy links if any)
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
