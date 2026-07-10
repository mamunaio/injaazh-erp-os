import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISequenceStep {
  stepNumber: number;
  delayDays: number; // 0 means send immediately when starting the sequence, or immediately after previous finishes
  subjectTemplate: string;
  bodyTemplate: string;
  useAI: boolean;
}

export interface ICampaign extends Document {
  name: string;
  niche?: string;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed';
  sequences: ISequenceStep[];
  senderAccounts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SequenceStepSchema = new Schema<ISequenceStep>({
  stepNumber: { type: Number, required: true },
  delayDays: { type: Number, required: true, default: 0 },
  subjectTemplate: { type: String, default: '' },
  bodyTemplate: { type: String, required: true },
  useAI: { type: Boolean, default: false },
});

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true, trim: true },
  niche: { type: String, trim: true },
  status: { type: String, enum: ['Draft', 'Active', 'Paused', 'Completed'], default: 'Draft' },
  sequences: [SequenceStepSchema],
  senderAccounts: [{ type: Schema.Types.ObjectId, ref: 'EmailAccount' }],
}, { timestamps: true });

// Force schema reload in Next.js dev mode
if (mongoose.models.Campaign) {
  delete mongoose.models.Campaign;
}
export const Campaign: Model<ICampaign> = mongoose.model<ICampaign>('Campaign', CampaignSchema);
