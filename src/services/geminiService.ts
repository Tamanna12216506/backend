import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private static getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in environment variables.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Updated model name - use 'gemini-1.5-flash' or 'gemini-1.5-pro'
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  static async generateQuestion(topic: string, difficulty: string) {
    try {
      const prompt = `Generate a coding interview question for topic: ${topic} with difficulty: ${difficulty}. 
      
Please format the response as JSON with the following structure:
{
  "title": "Question title",
  "description": "Detailed problem description",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "hints": ["hint1", "hint2", "hint3"],
  "solution": "Complete solution with explanation",
  "testCases": [
    {"input": "sample input", "expectedOutput": "expected output"}
  ]
}

Make sure the JSON is valid and properly formatted.`;

      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = await response.text();

      console.log('Raw Gemini response:', rawText); // Debug log

      // Strip Markdown code block if present
      const cleanText = rawText.replace(/```json|```/g, '').trim();

      try {
        const parsedQuestion = JSON.parse(cleanText);
        
        // Ensure required fields are present
        return {
          title: parsedQuestion.title || `${difficulty} ${topic} Problem`,
          description: parsedQuestion.description || 'Problem description not available',
          topic: topic,
          difficulty: difficulty,
          hints: parsedQuestion.hints || [
            'Break down the problem into smaller parts',
            'Consider edge cases',
            'Think about time complexity',
          ],
          solution: parsedQuestion.solution || 'Solution will be provided based on your approach',
          testCases: parsedQuestion.testCases || [
            { input: 'sample input', expectedOutput: 'sample output' },
          ],
        };
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        // Fallback if JSON parsing fails
        return {
          title: `${difficulty} ${topic} Problem`,
          description: rawText,
          topic: topic,
          difficulty: difficulty,
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
    } catch (error: any) {
      console.error('Gemini API error (generateQuestion):', error?.message || error);
      throw new Error(`Failed to generate question: ${error?.message || error}`);
    }
  }

  static async generateHint(questionDescription: string, currentCode: string) {
    try {
      const prompt = `Given this coding problem: "${questionDescription}"
And the current user code: "${currentCode}"

Provide a helpful hint to guide the user towards the solution without giving away the complete answer. Keep it concise and actionable.`;

      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    } catch (error: any) {
      console.error('Gemini API error (generateHint):', error?.message || error);
      throw new Error(`Failed to generate hint: ${error?.message || error}`);
    }
  }

  static async generateSolution(questionDescription: string) {
    try {
      const prompt = `Provide a complete solution with explanation for this coding problem: "${questionDescription}". 

Include:
1. A working code solution
2. Step-by-step explanation
3. Time and space complexity analysis
4. Any edge cases to consider`;

      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    } catch (error: any) {
      console.error('Gemini API error (generateSolution):', error?.message || error);
      throw new Error(`Failed to generate solution: ${error?.message || error}`);
    }
  }
}