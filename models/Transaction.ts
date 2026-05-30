import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  platform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
  type: 'Income' | 'Expense';
  amount: number;
  date: Date;
  category: string;
  description: string;
  projectId?: mongoose.Types.ObjectId;
  milestoneId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      enum: ['Freelancer', 'Direct', 'Upwork', 'Fiverr'],
      required: true,
    },
    type: {
      type: String,
      enum: ['Income', 'Expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    category: {
      type: String,
      required: true,
      default: 'Other',
    },
    description: {
      type: String,
      default: '',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'MarketplaceProject',
      required: false,
    },
    milestoneId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
TransactionSchema.index({ platform: 1, date: -1 });
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ projectId: 1 });
TransactionSchema.index({ projectId: 1, milestoneId: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
