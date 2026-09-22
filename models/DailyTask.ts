import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyTask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  completedAt?: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyTaskSchema = new Schema<IDailyTask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      enum: ['Client Work', 'Development', 'Design', 'Marketplace', 'Finance', 'Admin', 'General'],
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DailyTask || mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema);
