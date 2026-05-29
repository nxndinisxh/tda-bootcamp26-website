import express from 'express';
import Leaderboard from '../models/Leaderboard.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get overall leaderboard for a domain
router.get('/:domain/overall', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  try {
    const entries = await Leaderboard.find({ 
      domain, 
      leaderboardType: 'overall' 
    }).sort({ rank: 1 }).lean();

    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch overall leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch overall leaderboard.' });
  }
});

// Get weekly leaderboard for a domain and week number
router.get('/:domain/weekly/:week', authenticateToken, async (req, res) => {
  const { domain, week } = req.params;
  const parsedWeek = Number(week);

  if (isNaN(parsedWeek)) {
    return res.status(400).json({ message: 'Week must be a valid number.' });
  }

  try {
    const entries = await Leaderboard.find({ 
      domain, 
      leaderboardType: 'weekly',
      weekNumber: parsedWeek
    }).sort({ rank: 1 }).lean();

    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch weekly leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch weekly leaderboard.' });
  }
});

// Get available weeks list for a domain
router.get('/:domain/weeks', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  try {
    const weeks = await Leaderboard.distinct('weekNumber', {
      domain,
      leaderboardType: 'weekly'
    });

    // Sort weeks ascending
    const sortedWeeks = weeks.filter(w => w != null).sort((a, b) => a - b);
    res.json(sortedWeeks);
  } catch (error) {
    console.error('Failed to fetch available weeks:', error);
    res.status(500).json({ message: 'Failed to fetch available weeks.' });
  }
});

// Fallback/alias route: Get default standings for a domain (returns overall standings)
router.get('/:domain', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  try {
    const entries = await Leaderboard.find({ 
      domain, 
      leaderboardType: 'overall' 
    }).sort({ rank: 1 }).lean();

    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard.' });
  }
});

export default router;

