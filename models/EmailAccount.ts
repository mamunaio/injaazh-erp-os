import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailAccount extends Document {
  email: string;
  senderName?: string;
  appPassword: string; // Stored securely/encrypted if possible, but for MVP it's plaintext
  accountType?: 'gmail' | 'smtp';
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  isActive: boolean;
  dailyLimit: number;
  sentToday: number;
  lastResetDate: Date;
  warmupEnabled?: boolean;
  warmupDailyLimit?: number;
  warmupSentToday?: number;
  lastWarmupCheck?: Date;
  userId?: mongoose.Types.ObjectId;
  isGlobal?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAccountSchema = new Schema<IEmailAccount>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  senderName: { type: String },
  appPassword: { type: String, required: true },
  accountType: { type: String, enum: ['gmail', 'smtp'], default: 'gmail' },
  smtpHost: { type: String },
  smtpPort: { type: Number },
  smtpSecure: { type: Boolean, default: true },
  imapHost: { type: String },
  imapPort: { type: Number },
  imapSecure: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  dailyLimit: { type: Number, default: 15 },
  sentToday: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
  warmupEnabled: { type: Boolean, default: false },
  warmupDailyLimit: { type: Number, default: 5 },
  warmupSentToday: { type: Number, default: 0 },
  lastWarmupCheck: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  isGlobal: { type: Boolean, default: false },
}, { timestamps: true });

export const EmailAccount: Model<IEmailAccount> = mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', EmailAccountSchema);
