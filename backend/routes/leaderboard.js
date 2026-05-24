import express from 'express';
import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';
import { authenticateToken, requireDomainAccess } from '../middleware/auth.js';

const router = express.Router();

// Get domain leaderboard
router.get('/:domain', authenticateToken, async (req, res) => {
  const { domain } = req.params;

  try {
    const domainEntries = await Leaderboard.find({ domain }).sort({ totalScore: -1 }).lean();

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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().lean();

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

// Update score for a user in a domain
router.post('/:domain/scores', authenticateToken, requireDomainAccess(), async (req, res) => {
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
    let entry = await Leaderboard.findOne({ userId, domain });

    if (!entry) {
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

    entry.scores = { ...entry.scores, [taskName]: parsedScore };
    entry.totalScore = Object.values(entry.scores).reduce((sum, val) => sum + val, 0);
    entry.markModified('scores');
    await entry.save();

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

export default router;
