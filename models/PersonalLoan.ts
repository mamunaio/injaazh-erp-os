import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPersonalLoan extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'Borrowed' | 'Lent';
  personName: string;
  amount: number;
  date: Date;
  expectedReturnDate?: Date;
  status: 'Pending' | 'Settled';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalLoanSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Borrowed', 'Lent'],
    },
    personName: {
      type: String,
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
    expectedReturnDate: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Settled'],
      default: 'Pending',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

PersonalLoanSchema.index({ userId: 1, date: -1 });

export const PersonalLoan: Model<IPersonalLoan> =
  mongoose.models.PersonalLoan || mongoose.model<IPersonalLoan>('PersonalLoan', PersonalLoanSchema);
