"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Performance_1 = __importDefault(require("../models/Performance"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Update performance
router.post('/update', auth_1.authenticateToken, async (req, res) => {
    try {
        const { questionId, status, timeSpent, code, notes } = req.body;
        const userId = req.user?._id;
        let performance = await Performance_1.default.findOne({ userId, questionId });
        if (performance) {
            performance.status = status;
            performance.timeSpent += timeSpent || 0;
            performance.attempts += 1;
            performance.lastAttemptedAt = new Date();
            if (code)
                performance.code = code;
            if (notes)
                performance.notes = notes;
        }
        else {
            performance = new Performance_1.default({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get user performance stats
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?._id;
        const stats = await Performance_1.default.aggregate([
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
            formattedStats[stat._id] = stat.count;
            formattedStats.totalTime += stat.totalTime;
        });
        res.json(formattedStats);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get performance history
router.get('/history', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 10 } = req.query;
        const history = await Performance_1.default.find({ userId })
            .populate('questionId', 'title difficulty topic')
            .sort({ lastAttemptedAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const total = await Performance_1.default.countDocuments({ userId });
        res.json({
            history,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=performance.js.map