import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailAccount extends Document {
  email: string;
  appPassword: string; // Stored securely/encrypted if possible, but for MVP it's plaintext
  isActive: boolean;
  dailyLimit: number;
  sentToday: number;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAccountSchema = new Schema<IEmailAccount>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  appPassword: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  dailyLimit: { type: Number, default: 15 },
  sentToday: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
}, { timestamps: true });

export const EmailAccount: Model<IEmailAccount> = mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', EmailAccountSchema);
