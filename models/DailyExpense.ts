import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyExpense extends Document {
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyExpenseSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Food & Dining', 
        'Transportation', 
        'Office Supplies', 
        'Utilities', 
        'Shopping', 
        'Entertainment', 
        'Healthcare', 
        'Software & Subscriptions',
        'Miscellaneous'
      ],
      default: 'Miscellaneous',
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Mobile Banking', 'Bank Transfer'],
      default: 'Cash',
    }
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DailyExpenseSchema.index({ date: -1 });
DailyExpenseSchema.index({ category: 1, date: -1 });

export const DailyExpense: Model<IDailyExpense> =
  mongoose.models.DailyExpense || mongoose.model<IDailyExpense>('DailyExpense', DailyExpenseSchema);
