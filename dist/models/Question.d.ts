import mongoose, { Document } from 'mongoose';
export interface IQuestion extends Document {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    hints: string[];
    solution: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    testCases: Array<{
        input: string;
        expectedOutput: string;
    }>;
}
declare const _default: mongoose.Model<IQuestion, {}, {}, {}, mongoose.Document<unknown, {}, IQuestion, {}> & IQuestion & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Question.d.ts.map