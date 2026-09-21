import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeal extends Document {
  title: string;
  clientName: string;
  value: number;
  stage: 'Qualified' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  owner?: mongoose.Types.ObjectId;
  expectedCloseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    value: { type: Number, required: true, default: 0 },
    stage: {
      type: String,
      enum: ['Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      default: 'Qualified',
      index: true
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    expectedCloseDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index for Kanban queries
DealSchema.index({ stage: 1, createdAt: -1 });

export const Deal: Model<IDeal> = mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);
