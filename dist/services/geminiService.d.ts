export declare class GeminiService {
    private static getModel;
    static generateQuestion(topic: string, difficulty: string): Promise<any>;
    static generateHint(questionDescription: string, currentCode: string): Promise<string>;
    static generateSolution(questionDescription: string): Promise<string>;
}
//# sourceMappingURL=geminiService.d.ts.map