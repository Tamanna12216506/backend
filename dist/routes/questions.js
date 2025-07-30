"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Question_1 = __importDefault(require("../models/Question"));
const auth_1 = require("../middleware/auth");
const geminiService_1 = require("../services/geminiService");
const router = express_1.default.Router();
// Get random question
router.get('/random', async (req, res) => {
    try {
        const count = await Question_1.default.countDocuments();
        const random = Math.floor(Math.random() * count);
        const question = await Question_1.default.findOne().skip(random);
        if (!question) {
            return res.status(404).json({ message: 'No questions found' });
        }
        res.json(question);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get questions by topic
router.get('/topic/:topic', auth_1.authenticateToken, async (req, res) => {
    try {
        const { topic } = req.params;
        const { difficulty, page = 1, limit = 10 } = req.query;
        const filter = { topic };
        if (difficulty)
            filter.difficulty = difficulty;
        const questions = await Question_1.default.find(filter)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });
        const total = await Question_1.default.countDocuments(filter);
        res.json({
            questions,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Generate new question using AI
router.post('/generate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { topic, difficulty = 'Medium' } = req.body;
        const generatedQuestion = await geminiService_1.GeminiService.generateQuestion(topic, difficulty);
        const question = new Question_1.default({
            ...generatedQuestion,
            topic,
            difficulty,
        });
        await question.save();
        res.json(question);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate question' });
    }
});
// Get AI hint
router.post('/:id/hint', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentCode } = req.body;
        const question = await Question_1.default.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        const hint = await geminiService_1.GeminiService.generateHint(question.description, currentCode || '');
        res.json({ hint });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate hint' });
    }
});
// Get AI solution
router.get('/:id/solution', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question_1.default.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        const solution = await geminiService_1.GeminiService.generateSolution(question.description);
        res.json({ solution });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate solution' });
    }
});
exports.default = router;
//# sourceMappingURL=questions.js.map