import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoanPayment {
  _id?: string;
  amount: number;
  date: Date;
  paymentMethod?: string;
  note?: string;
  createdAt?: Date;
}

export interface IPersonalLoan extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'Borrowed' | 'Lent';
  personName: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  date: Date;
  expectedReturnDate?: Date;
  status: 'Pending' | 'Partial' | 'Settled';
  description?: string;
  payments: ILoanPayment[];
  createdAt: Date;
  updatedAt: Date;
}

const LoanPaymentSchema = new Schema(
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
    paymentMethod: {
      type: String,
      default: 'Cash',
      enum: ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Credit Card', 'Other'],
    },
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

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
    phone: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
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
      enum: ['Pending', 'Partial', 'Settled'],
      default: 'Pending',
    },
    description: {
      type: String,
      default: '',
    },
    payments: [LoanPaymentSchema],
  },
  {
    timestamps: true,
  }
);

PersonalLoanSchema.index({ userId: 1, date: -1 });
PersonalLoanSchema.index({ status: 1, type: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.PersonalLoan) {
  delete (mongoose.models as any).PersonalLoan;
}

export const PersonalLoan: Model<IPersonalLoan> =
  mongoose.models.PersonalLoan || mongoose.model<IPersonalLoan>('PersonalLoan', PersonalLoanSchema);

