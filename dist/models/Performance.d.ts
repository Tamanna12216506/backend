import mongoose, { Document } from 'mongoose';
export interface IPerformance extends Document {
    userId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    status: 'solved' | 'attempted' | 'unsolved';
    timeSpent: number;
    attempts: number;
    lastAttemptedAt: Date;
    code?: string;
    notes?: string;
}
declare const _default: mongoose.Model<IPerformance, {}, {}, {}, mongoose.Document<unknown, {}, IPerformance, {}> & IPerformance & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Performance.d.ts.map