import express from 'express';
import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import {
  authenticateToken,
  verifyClerkToken,
  getPrimaryVerifiedEmail,
  ALLOWED_EMAIL_DOMAIN,
  VALID_DOMAINS
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/onboard', async (req, res) => {
  const verifiedToken = await verifyClerkToken(req);
  if (!verifiedToken || !verifiedToken.sub) {
    return res.status(401).json({ message: 'Clerk authentication required' });
  }
  const userId = verifiedToken.sub;

  const { domains, name } = req.body;

  if (!Array.isArray(domains) || domains.length < 1 || domains.length > 3) {
    return res.status(400).json({ message: 'You must select between 1 and 3 domains.' });
  }

  const invalidDomains = domains.filter(d => !VALID_DOMAINS.includes(d));
  if (invalidDomains.length > 0) {
    return res.status(400).json({ message: `Invalid domain selected: ${invalidDomains.join(', ')}` });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const finalName = name?.trim() || clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';

    const email = getPrimaryVerifiedEmail(clerkUser);

    if (!email) {
      return res.status(403).json({
        message: 'Your email address has not been verified. Please verify your email before continuing.',
        domainError: true
      });
    }

    if (!email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      console.warn(`Onboarding blocked for ${userId}: invalid email domain ${email}`);
      return res.status(403).json({
        message: 'Only learner.manipal.edu accounts are allowed.',
        domainError: true
      });
    }

    let existingUser = await User.findOne({ id: userId });
    if (existingUser) {
      return res.status(400).json({ message: 'Account is already onboarded.' });
    }

    const nameExists = await User.findOne({ name: { $regex: new RegExp(`^${finalName}$`, 'i') } });
    if (nameExists) {
      return res.status(400).json({ message: 'This name is already taken. Please choose a different name.' });
    }

    const newUser = await User.create({
      id: userId,
      name: finalName,
      email: email.toLowerCase(),
      passwordHash: 'clerk_authenticated',
      domains,
      role: 'user',
      adminDomains: [],
      createdAt: new Date().toISOString()
    });

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

    res.status(201).json({
      message: 'Onboarding successful',
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
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Internal server error during onboarding.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      domains: req.user.domains,
      adminDomains: req.user.adminDomains
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
