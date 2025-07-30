import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformance extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  status: 'solved' | 'attempted' | 'unsolved';
  timeSpent: number; // in minutes
  attempts: number;
  lastAttemptedAt: Date;
  code?: string;
  notes?: string;
}

const performanceSchema = new Schema<IPerformance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  status: {
    type: String,
    enum: ['solved', 'attempted', 'unsolved'],
    default: 'unsolved',
  },
  timeSpent: {
    type: Number,
    default: 0,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastAttemptedAt: {
    type: Date,
    default: Date.now,
  },
  code: {
    type: String,
  },
  notes: {
    type: String,
  },
});

performanceSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export default mongoose.model<IPerformance>('Performance', performanceSchema);