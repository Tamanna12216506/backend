"use strict";
// import { GoogleGenerativeAI } from '@google/generative-ai';
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
// export class GeminiService {
//   static async generateQuestion(topic: string, difficulty: string) {
//     try {
//       const prompt = `Generate a coding interview question for topic: ${topic} with difficulty: ${difficulty}.
//       Please format the response as JSON with the following structure:
//       {
//         "title": "Question title",
//         "description": "Detailed problem description",
//         "hints": ["hint1", "hint2", "hint3"],
//         "solution": "Complete solution with explanation",
//         "testCases": [
//           {"input": "sample input", "expectedOutput": "expected output"}
//         ]
//       }`;
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
//       try {
//         return JSON.parse(text);
//       } catch {
//         // Fallback if JSON parsing fails
//         return {
//           title: `${difficulty} ${topic} Problem`,
//           description: text,
//           hints: ["Break down the problem into smaller parts", "Consider edge cases", "Think about time complexity"],
//           solution: "Solution will be provided based on your approach",
//           testCases: [
//             { input: "sample input", expectedOutput: "sample output" }
//           ]
//         };
//       }
//     } catch (error) {
//       console.error('Gemini API error:', error);
//       throw new Error('Failed to generate question');
//     }
//   }
//   static async generateHint(questionDescription: string, currentCode: string) {
//     try {
//       const prompt = `Given this coding problem: "${questionDescription}"
//       And the current user code: "${currentCode}"
//       Provide a helpful hint to guide the user towards the solution without giving away the complete answer.`;
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       return response.text();
//     } catch (error) {
//       console.error('Gemini API error:', error);
//       throw new Error('Failed to generate hint');
//     }
//   }
//   static async generateSolution(questionDescription: string) {
//     try {
//       const prompt = `Provide a complete solution with explanation for this coding problem: "${questionDescription}"
//       Include time and space complexity analysis.`;
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       return response.text();
//     } catch (error) {
//       console.error('Gemini API error:', error);
//       throw new Error('Failed to generate solution');
//     }
//   }
// }
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    static getModel() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is missing in environment variables.');
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
    static async generateQuestion(topic, difficulty) {
        try {
            const prompt = `Generate a coding interview question for topic: ${topic} with difficulty: ${difficulty}.
Please format the response as JSON with the following structure:
{
  "title": "Question title",
  "description": "Detailed problem description",
  "hints": ["hint1", "hint2", "hint3"],
  "solution": "Complete solution with explanation",
  "testCases": [
    {"input": "sample input", "expectedOutput": "expected output"}
  ]
}`;
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = await response.text();
            // Strip Markdown code block if present
            const cleanText = rawText.replace(/```json|```/g, '').trim();
            try {
                return JSON.parse(cleanText);
            }
            catch {
                // Fallback if JSON parsing fails
                return {
                    title: `${difficulty} ${topic} Problem`,
                    description: rawText,
                    hints: [
                        'Break down the problem into smaller parts',
                        'Consider edge cases',
                        'Think about time complexity',
                    ],
                    solution: 'Solution will be provided based on your approach',
                    testCases: [
                        { input: 'sample input', expectedOutput: 'sample output' },
                    ],
                };
            }
        }
        catch (error) {
            console.error('Gemini API error (generateQuestion):', error?.message || error);
            throw new Error('Failed to generate question');
        }
    }
    static async generateHint(questionDescription, currentCode) {
        try {
            const prompt = `Given this coding problem: "${questionDescription}"
And the current user code: "${currentCode}"
Provide a helpful hint to guide the user towards the solution without giving away the complete answer.`;
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return await response.text();
        }
        catch (error) {
            console.error('Gemini API error (generateHint):', error?.message || error);
            throw new Error('Failed to generate hint');
        }
    }
    static async generateSolution(questionDescription) {
        try {
            const prompt = `Provide a complete solution with explanation for this coding problem: "${questionDescription}".
Include time and space complexity analysis.`;
            const model = this.getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return await response.text();
        }
        catch (error) {
            console.error('Gemini API error (generateSolution):', error?.message || error);
            throw new Error('Failed to generate solution');
        }
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=geminiService.js.map