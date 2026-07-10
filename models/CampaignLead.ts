import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaignLead extends Document {
  campaignId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  status: 'Active' | 'Replied' | 'Unsubscribed' | 'Finished' | 'Failed';
  currentStep: number;
  nextActionDate: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignLeadSchema = new Schema<ICampaignLead>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  status: { type: String, enum: ['Active', 'Replied', 'Unsubscribed', 'Finished', 'Failed'], default: 'Active' },
  currentStep: { type: Number, default: 1 },
  nextActionDate: { type: Date, required: true },
  errorMessage: { type: String },
}, { timestamps: true });

// Prevent a lead from being active in the same campaign multiple times simultaneously
CampaignLeadSchema.index({ campaignId: 1, leadId: 1 }, { unique: true });
CampaignLeadSchema.index({ status: 1, nextActionDate: 1 });

export const CampaignLead: Model<ICampaignLead> = mongoose.models.CampaignLead || mongoose.model<ICampaignLead>('CampaignLead', CampaignLeadSchema);
