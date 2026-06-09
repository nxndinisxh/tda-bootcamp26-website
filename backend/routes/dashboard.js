import express from 'express';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import Announcement from '../models/Announcement.js';
import Resource from '../models/Resource.js';
import WeekLock from '../models/WeekLock.js';
import UserProgress from '../models/UserProgress.js';
import { authenticateToken } from '../middleware/auth.js';
import { getEquivalentDomains } from '../config/constants.js';

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


/*
=========================================
GET STUDENT PROGRESS OVERVIEW
=========================================
*/

router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const progressData = [];

    for (const domain of user.domains) {
      const equivalentDomains = getEquivalentDomains(domain);

      // 1. Fetch all resources for this domain
      const resources = await Resource.find({ domain: { $in: equivalentDomains } });
      
      // 2. Fetch locks for this domain
      const locks = await WeekLock.find({ domain: { $in: equivalentDomains } });
      const lockMap = {};
      locks.forEach(l => {
        lockMap[l.week] = l.isLocked;
      });

      // 3. Filter resources that belong to unlocked weeks
      // A week is unlocked if isLocked is explicitly false
      const unlockedResources = resources.filter(r => lockMap[r.week] === false);
      const totalResources = unlockedResources.length;

      // 4. Fetch completed progress for these resources
      const unlockedResourceIds = unlockedResources.map(r => r.id);
      let completedCount = 0;
      if (totalResources > 0) {
        completedCount = await UserProgress.countDocuments({
          userId: user.id,
          resourceId: { $in: unlockedResourceIds },
          completed: true
        });
      }

      progressData.push({
        domain,
        completed: completedCount,
        total: totalResources,
        percentage: totalResources > 0 ? Math.round((completedCount / totalResources) * 100) : 0
      });
    }

    return res.json({ progress: progressData });
  } catch (error) {
    console.error('Dashboard progress error:', error);
    return res.status(500).json({ message: 'Failed to fetch progress overview' });
  }
});

export default router;
