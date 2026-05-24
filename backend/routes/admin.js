import express from 'express';
import User from '../models/User.js';
import { VALID_DOMAINS } from '../config/constants.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

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

export default router;
