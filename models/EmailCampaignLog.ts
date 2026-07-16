import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailCampaignLog extends Document {
  leadId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  messageId: string;
  threadId?: string;
  type: 'Initial' | 'Follow-up';
  status: 'Sent' | 'Failed' | 'Bounced';
  errorMessage?: string;
  sentAt: Date;
  sentBy?: mongoose.Types.ObjectId;
  openedAt?: Date;
  clicks: number;
}

const EmailCampaignLogSchema = new Schema<IEmailCampaignLog>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  messageId: { type: String, required: true, unique: true },
  threadId: { type: String },
  type: { type: String, enum: ['Initial', 'Follow-up'], required: true },
  status: { type: String, enum: ['Sent', 'Failed', 'Bounced'], default: 'Sent' },
  errorMessage: { type: String },
  sentAt: { type: Date, default: Date.now },
  sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
  openedAt: { type: Date },
  clicks: { type: Number, default: 0 },
});

// Indexes for fast lookups by Message-ID when checking replies
EmailCampaignLogSchema.index({ messageId: 1 });
EmailCampaignLogSchema.index({ leadId: 1 });

export const EmailCampaignLog: Model<IEmailCampaignLog> = mongoose.models.EmailCampaignLog || mongoose.model<IEmailCampaignLog>('EmailCampaignLog', EmailCampaignLogSchema);
