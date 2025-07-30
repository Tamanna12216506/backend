import express from 'express';
import Performance from '../models/Performance';
import Question from '../models/Question';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Update performance
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { questionId, status, timeSpent, code, notes } = req.body;
    const userId = req.user?._id;

    let performance = await Performance.findOne({ userId, questionId });
    
    if (performance) {
      performance.status = status;
      performance.timeSpent += timeSpent || 0;
      performance.attempts += 1;
      performance.lastAttemptedAt = new Date();
      if (code) performance.code = code;
      if (notes) performance.notes = notes;
    } else {
      performance = new Performance({
        userId,
        questionId,
        status,
        timeSpent: timeSpent || 0,
        attempts: 1,
        code,
        notes,
      });
    }

    await performance.save();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user performance stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id;

    const stats = await Performance.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalTime: { $sum: '$timeSpent' },
        },
      },
    ]);

    const formattedStats = {
      solved: 0,
      attempted: 0,
      unsolved: 0,
      totalTime: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
      formattedStats.totalTime += stat.totalTime;
    });

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    const history = await Performance.find({ userId })
      .populate('questionId', 'title difficulty topic')
      .sort({ lastAttemptedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Performance.countDocuments({ userId });

    res.json({
      history,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;