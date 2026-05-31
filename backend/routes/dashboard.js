import express from 'express';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Announcement from '../models/Announcement.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/*
=========================================
GET STUDENT STANDINGS
=========================================
*/

router.get('/standings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const standings = [];

    for (const domain of user.domains) {
      const overallEntry = await Leaderboard.findOne({
        userId: user.id,
        domain,
        leaderboardType: 'overall'
      }).lean();

      const latestWeeklyEntry = await Leaderboard.findOne({
        userId: user.id,
        domain,
        leaderboardType: 'weekly'
      })
        .sort({ weekNumber: -1 })
        .lean();

      standings.push({
        domain,
        weeklyRank: latestWeeklyEntry?.rank || null,
        weeklyScore: latestWeeklyEntry?.score || 0,
        latestWeek: latestWeeklyEntry?.weekNumber || null,

        overallRank: overallEntry?.rank || null,
        overallScore: overallEntry?.score || 0
      });
    }

    return res.json({
      standings
    });
  } catch (error) {
    console.error('Dashboard standings error:', error);

    return res.status(500).json({
      message: 'Failed to fetch standings'
    });
  }
});

/*
=========================================
GET USER ANNOUNCEMENTS
=========================================
*/

router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({
      id: req.user.id
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const announcements = await Announcement.find({
      domain: {
        $in: user.domains
      }
    })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    return res.json(announcements);
  } catch (error) {
    console.error('Dashboard announcements error:', error);

    return res.status(500).json({
      message: 'Failed to fetch announcements'
    });
  }
});

export default router;
