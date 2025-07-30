// import express from 'express';
// import Question from '../models/Question';
// import Performance from '../models/Performance';
// import { authenticateToken } from '../middleware/auth';
// import { GeminiService } from '../services/geminiService';
// const router = express.Router();

// // Get random question
// router.get('/random', async (req, res) => {
//   try {
//     const count = await Question.countDocuments();
//     const random = Math.floor(Math.random() * count);
//     const question = await Question.findOne().skip(random);
    
//     if (!question) {
//       return res.status(404).json({ message: 'No questions found' });
//     }

//     res.json(question);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get questions by topic
// router.get('/topic/:topic', authenticateToken, async (req, res) => {
//   try {
//     const { topic } = req.params;
//     const { difficulty, page = 1, limit = 10 } = req.query;
    
//     const filter: any = { topic };
//     if (difficulty) filter.difficulty = difficulty;

//     const questions = await Question.find(filter)
//       .limit(Number(limit))
//       .skip((Number(page) - 1) * Number(limit))
//       .sort({ createdAt: -1 });

//     const total = await Question.countDocuments(filter);

//     res.json({
//       questions,
//       total,
//       page: Number(page),
//       totalPages: Math.ceil(total / Number(limit)),
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Generate new question using AI
// router.post('/generate', authenticateToken, async (req, res) => {
//   try {
//     const { topic, difficulty = 'Medium' } = req.body;
    
//     const generatedQuestion = await GeminiService.generateQuestion(topic, difficulty);
    
//     const question = new Question({
//       ...generatedQuestion,
//       topic,
//       difficulty,
//     });
    
//     await question.save();
//     res.json(question);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to generate question' });
//   }
// });

// // Get AI hint
// router.post('/:id/hint', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { currentCode } = req.body;
    
//     const question = await Question.findById(id);
//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     const hint = await GeminiService.generateHint(question.description, currentCode || '');
//     res.json({ hint });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to generate hint' });
//   }
// });

// // Get AI solution
// router.get('/:id/solution', authenticateToken, async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const question = await Question.findById(id);
//     if (!question) {
//       return res.status(404).json({ message: 'Question not found' });
//     }

//     const solution = await GeminiService.generateSolution(question.description);
//     res.json({ solution });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to generate solution' });
//   }
// });

// export default router;
// src/routes/questionRoute.ts
import express from 'express';
import { GeminiService } from '../services/geminiService';
import  Question  from '../models/Question'; // Adjust path as needed
// import  { auth }  from '../middleware/auth'; // Adjust path as needed
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Test endpoint
router.get('/test-gemini', async (req, res) => {
  try {
    const question = await GeminiService.generateQuestion('arrays', 'easy');
    res.json(question);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).json({ message: 'Gemini failed', error: error.message || error });
  }
});

// Generate new question with AI
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    
    console.log('Generating question for:', { topic, difficulty }); // Debug log
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const questionData = await GeminiService.generateQuestion(
      topic, 
      difficulty || 'Medium'
    );

    console.log('Generated question data:', questionData); // Debug log

    // Save to database (optional)
    try {
      const question = new Question({
        ...questionData,
        createdBy: 'AI', // You can set this to the user ID if needed
        createdAt: new Date()
      });
      
      const savedQuestion = await question.save();
      res.json(savedQuestion);
    } catch (dbError) {
      console.warn('Database save failed, returning generated question directly:', dbError);
      // If database save fails, still return the generated question
      res.json({
        _id: Date.now().toString(), // Temporary ID
        ...questionData,
        createdAt: new Date()
      });
    }

  } catch (error: any) {
    console.error('Generate question error:', error);
    res.status(500).json({ 
      message: 'Failed to generate question', 
      error: error.message || error 
    });
  }
});

// Get random question from database
router.get('/random', authenticateToken, async (req, res) => {
  try {
    const count = await Question.countDocuments();
    if (count === 0) {
      // If no questions in database, generate one
      const questionData = await GeminiService.generateQuestion('arrays', 'medium');
      return res.json({
        _id: Date.now().toString(),
        ...questionData,
        createdAt: new Date()
      });
    }
    
    const random = Math.floor(Math.random() * count);
    const question = await Question.findOne().skip(random);
    res.json(question);
  } catch (error: any) {
    console.error('Random question error:', error);
    res.status(500).json({ 
      message: 'Failed to get random question', 
      error: error.message || error 
    });
  }
});

// Get hint for a question
router.post('/:id/hint', authenticateToken, async (req, res) => {
  try {
    const { currentCode } = req.body;
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const hint = await GeminiService.generateHint(question.description, currentCode || '');
    res.json({ hint });
  } catch (error: any) {
    console.error('Generate hint error:', error);
    res.status(500).json({ 
      message: 'Failed to generate hint', 
      error: error.message || error 
    });
  }
});

// Get solution for a question
router.get('/:id/solution', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // If solution exists in database, return it
    if (question.solution) {
      return res.json({ solution: question.solution });
    }

    // Otherwise generate it
    const solution = await GeminiService.generateSolution(question.description);
    
    // Optionally save the generated solution back to the database
    try {
      await Question.findByIdAndUpdate(req.params.id, { solution });
    } catch (updateError) {
      console.warn('Failed to update question with solution:', updateError);
    }

    res.json({ solution });
  } catch (error: any) {
    console.error('Generate solution error:', error);
    res.status(500).json({ 
      message: 'Failed to generate solution', 
      error: error.message || error 
    });
  }
});

export default router;