import connectDB from "./config/db.js";
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import User from './models/User.js';
import Resource from './models/Resource.js';
import Announcement from './models/Announcement.js';
import Leaderboard from './models/Leaderboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Valid domains list
const VALID_DOMAINS = ['Machine Learning', 'Deep Learning', 'DAV', 'DSA', 'WebDev'];

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Access Control Middlewares
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

const requireDomainAccess = (getDomainParam = (req) => req.params.domain) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const domain = getDomainParam(req);

    // Super Admin has access to everything
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Domain Admin must have access to this specific domain
    if (req.user.role === 'admin' && req.user.adminDomains && req.user.adminDomains.includes(domain)) {
      return next();
    }

    return res.status(403).json({ message: `Access denied: you do not have admin rights for ${domain}` });
  };
};

// --- AUTHENTICATION ENDPOINTS ---

// Register
app.post('/api/auth/register', async (req, res) => {
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
    // FIX: Use findOne instead of fetching all users
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

    // FIX: Create leaderboard entries directly with insertMany (only new ones, not the whole array)
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
app.post('/api/auth/login', async (req, res) => {
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

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

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
app.get('/api/auth/me', authenticateToken, async (req, res) => {
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

// --- RESOURCES ENDPOINTS ---

// Get domain resources
app.get('/api/domains/:domain/resources', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  if (req.user.role === 'user' && !req.user.domains.includes(domain)) {
    return res.status(403).json({ message: `Access denied. You are not registered for the ${domain} domain.` });
  }

  try {
    // FIX: Query by domain directly instead of fetching all and filtering
    const domainResources = await Resource.find({ domain });
    res.json(domainResources);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving resources.' });
  }
});

// Add resource
app.post('/api/domains/:domain/resources', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain } = req.params;
  const { title, description, link, week } = req.body;

  if (!title || !link || !week) {
    return res.status(400).json({ message: 'Title, link, and week are required.' });
  }

  try {
    // FIX: Use Resource.create() instead of db.getResources() / db.saveResources()
    const newResource = await Resource.create({
      id: `res_${Date.now()}`,
      domain,
      title,
      description: description || '',
      link,
      week,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newResource);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add resource.' });
  }
});

// Update resource
app.put('/api/domains/:domain/resources/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id } = req.params;
  const { title, description, link, week } = req.body;

  try {
    // FIX: Use findOneAndUpdate() instead of db.getResources() / db.saveResources()
    const updated = await Resource.findOneAndUpdate(
      { id },
      {
        $set: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(link && { link }),
          ...(week && { week })
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resource.' });
  }
});

// Delete resource
app.delete('/api/domains/:domain/resources/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id } = req.params;

  try {
    // FIX: Use findOneAndDelete() instead of db.getResources() / db.saveResources()
    const deleted = await Resource.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource.' });
  }
});


// --- ANNOUNCEMENTS ENDPOINTS ---

// Get domain announcements
app.get('/api/domains/:domain/announcements', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  if (req.user.role === 'user' && !req.user.domains.includes(domain)) {
    return res.status(403).json({ message: `Access denied. You are not registered for the ${domain} domain.` });
  }

  try {
    // FIX: Query by domain directly, sorted newest first
    const domainAnnouncements = await Announcement.find({ domain }).sort({ date: -1 });
    res.json(domainAnnouncements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load announcements.' });
  }
});

// Create announcement
app.post('/api/domains/:domain/announcements', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    // FIX: Use Announcement.create() instead of db.getAnnouncements() / db.saveAnnouncements()
    const newAnnouncement = await Announcement.create({
      id: `ann_${Date.now()}`,
      domain,
      title,
      content,
      date: new Date().toISOString(),
      author: req.user.name
    });

    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement.' });
  }
});

// Delete announcement
app.delete('/api/domains/:domain/announcements/:id', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { id } = req.params;

  try {
    // FIX: Use findOneAndDelete() instead of db.getAnnouncements() / db.saveAnnouncements()
    const deleted = await Announcement.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
});


// --- LEADERBOARD ENDPOINTS ---

// Get domain leaderboard
app.get('/api/leaderboard/:domain', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  try {
    // FIX: Query by domain and sort directly in MongoDB
    const domainEntries = await Leaderboard.find({ domain }).sort({ totalScore: -1 }).lean();

    // Re-calculate ranks dynamically for display
    const ranked = domainEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaderboard.' });
  }
});

// Get overall leaderboard
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().lean();

    // Aggregate scores per user
    const userScores = {};
    leaderboard.forEach(entry => {
      if (!userScores[entry.userId]) {
        userScores[entry.userId] = {
          userId: entry.userId,
          userName: entry.userName,
          totalScore: 0,
          domains: []
        };
      }
      userScores[entry.userId].totalScore += entry.totalScore;
      if (!userScores[entry.userId].domains.includes(entry.domain)) {
        userScores[entry.userId].domains.push(entry.domain);
      }
    });

    const overallList = Object.values(userScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.json(overallList);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch overall leaderboard.' });
  }
});

// Update score for a user in a domain (Domain Head or Super Admin)
app.post('/api/leaderboard/:domain/scores', authenticateToken, requireDomainAccess(), async (req, res) => {
  const { domain } = req.params;
  const { userId, taskName, score } = req.body;

  if (!userId || !taskName || score === undefined) {
    return res.status(400).json({ message: 'userId, taskName, and score are required.' });
  }

  const parsedScore = parseFloat(score);
  if (isNaN(parsedScore)) {
    return res.status(400).json({ message: 'Score must be a number.' });
  }

  try {
    // FIX: Use findOne to get the entry, modify it, then save — no more insertMany for updates
    let entry = await Leaderboard.findOne({ userId, domain });

    if (!entry) {
      // User doesn't have a leaderboard entry yet — look them up
      const user = await User.findOne({ id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found in system.' });
      }

      entry = new Leaderboard({
        id: `lb_${Date.now()}`,
        userId,
        userName: user.name,
        domain,
        scores: {},
        totalScore: 0,
        rank: 999
      });
    }

    // Update the task score and recalculate total
    entry.scores = { ...entry.scores, [taskName]: parsedScore };
    entry.totalScore = Object.values(entry.scores).reduce((sum, val) => sum + val, 0);
    entry.markModified('scores'); // ← required for Object type fields
    await entry.save();

    // Recalculate and persist ranks for all entries in this domain
    const allDomainEntries = await Leaderboard.find({ domain }).sort({ totalScore: -1 });
    const rankUpdates = allDomainEntries.map((e, idx) =>
      Leaderboard.findOneAndUpdate({ _id: e._id }, { $set: { rank: idx + 1 } })
    );
    await Promise.all(rankUpdates);

    res.json({ message: 'Score updated successfully', entry });
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({ message: 'Failed to update score.' });
  }
});


// --- ADMIN MANAGEMENT ENDPOINTS ---

// List all users
app.get('/api/admin/users', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// Update user role and admin domains (Super Admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const { role, adminDomains } = req.body;

  if (!role) {
    return res.status(400).json({ message: 'Role is required.' });
  }

  if (role === 'admin' && (!adminDomains || !Array.isArray(adminDomains))) {
    return res.status(400).json({ message: 'For admin role, adminDomains array is required.' });
  }

  try {
    // FIX: Use findOne + save instead of fetching all users and db.saveUsers()
    const user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent demoting the primary super admin
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

// Fallback to React app index.html for client-side routing in production (ignoring /api)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});