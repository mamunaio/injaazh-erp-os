import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPhase {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

export interface IInvestmentItem {
  id: string;
  description: string;
  cost: number;
}

export interface IProposal extends Document {
  title: string;
  clientName: string;
  value: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  content: string;
  introduction: string;
  phases: IPhase[];
  investment: IInvestmentItem[];
  dealId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  shareToken?: string;
  dateSent?: Date;
  dateAccepted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PhaseSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  deliverables: [{ type: String }],
});

const InvestmentItemSchema = new Schema({
  id: { type: String, required: true },
  description: { type: String, default: '' },
  cost: { type: Number, default: 0 },
});

const ProposalSchema = new Schema<IProposal>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Proposal',
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      default: 'Client Name',
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'],
      default: 'Draft',
    },
    content: {
      type: String,
      default: '',
    },
    introduction: {
      type: String,
      default: '',
    },
    phases: {
      type: [PhaseSchema],
      default: [],
    },
    investment: {
      type: [InvestmentItemSchema],
      default: [],
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    dateSent: {
      type: Date,
    },
    dateAccepted: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite error in Next.js hot-reloading
export const Proposal: Model<IProposal> =
  mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', ProposalSchema);
