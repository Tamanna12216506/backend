// src/routes/geminiRoute.ts
import express from 'express';
import { GeminiService } from '../services/geminiService'; // Adjust the path if needed
const router = express.Router();

router.get('/test-gemini', async (req, res) => {
  try {
    const question = await GeminiService.generateQuestion('arrays', 'easy');
    res.json(question);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).json({ message: 'Gemini failed', error: error.message || error });
  }
});
export default router;

