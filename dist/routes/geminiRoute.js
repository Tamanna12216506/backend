"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/geminiRoute.ts
const express_1 = __importDefault(require("express"));
const geminiService_1 = require("../services/geminiService"); // Adjust the path if needed
const router = express_1.default.Router();
router.get('/test-gemini', async (req, res) => {
    try {
        const question = await geminiService_1.GeminiService.generateQuestion('arrays', 'easy');
        res.json(question);
    }
    catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ message: 'Gemini failed', error: error.message || error });
    }
});
exports.default = router;
//# sourceMappingURL=geminiRoute.js.map