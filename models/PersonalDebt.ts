import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentHistory {
  amount: number;
  date: Date;
  note?: string;
}

export interface IPersonalDebt extends Document {
  personName: string;
  amount: number; // Current remaining amount
  originalAmount: number; // Original debt amount
  paidAmount: number; // Total amount paid so far
  type: 'borrowed' | 'lent'; // 'borrowed' = I owe them, 'lent' = They owe me
  date: Date;
  status: 'pending' | 'settled';
  description: string;
  paymentHistory: IPaymentHistory[]; // Track all partial payments
  createdAt: Date;
  updatedAt: Date;
}

const PersonalDebtSchema: Schema = new Schema(
  {
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['borrowed', 'lent'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'settled'],
      default: 'pending',
    },
    description: {
      type: String,
      default: '',
    },
    paymentHistory: [
      {
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
        note: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PersonalDebtSchema.index({ status: 1, type: 1 });
PersonalDebtSchema.index({ date: -1 });

export const PersonalDebt: Model<IPersonalDebt> =
  mongoose.models.PersonalDebt || mongoose.model<IPersonalDebt>('PersonalDebt', PersonalDebtSchema);
