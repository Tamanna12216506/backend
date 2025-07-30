import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  hints: string[];
  solution: string;
   tags?: string[];
  createdAt?: Date; // ✅ Mark this optional
  updatedAt?: Date;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

const questionSchema = new Schema<IQuestion>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  hints: [{
    type: String,
  }],
  solution: {
    type: String,
    required: true,
  },
  testCases: [{
    input: String,
    expectedOutput: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IQuestion>('Question', questionSchema);