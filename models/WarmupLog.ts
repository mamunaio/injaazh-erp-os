import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWarmupLog extends Document {
  senderAccountId: mongoose.Types.ObjectId;
  receiverAccountId: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  messageId?: string;
  status: 'sent' | 'read' | 'unspammed' | 'replied' | 'failed';
  error?: string;
  sentAt: Date;
  updatedAt: Date;
}

const WarmupLogSchema = new Schema<IWarmupLog>({
  senderAccountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true },
  receiverAccountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  messageId: { type: String }, // Used to identify the email via IMAP
  status: { type: String, enum: ['sent', 'read', 'unspammed', 'replied', 'failed'], default: 'sent' },
  error: { type: String },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const WarmupLog: Model<IWarmupLog> = mongoose.models.WarmupLog || mongoose.model<IWarmupLog>('WarmupLog', WarmupLogSchema);
