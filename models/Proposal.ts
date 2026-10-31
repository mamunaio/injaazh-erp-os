import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProposalItem {
  title: string;
  description?: string;
  category?: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface IProposalMilestone {
  title: string;
  duration?: string;
  description?: string;
}

export interface IProposal extends Document {
  proposalNumber: string;
  slug?: string;
  title: string;
  
  // Company info
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  companyPhone?: string;
  companySignature?: string;

  // Client info
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientAddress?: string;
  clientPhone?: string;

  // Dates & Currency
  issueDate: Date;
  validUntil: Date;
  currency: string;

  // Proposal content
  executiveSummary: string;
  deliverablesSummary?: string;
  items: IProposalItem[];
  milestones: IProposalMilestone[];

  // Financials
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  // Terms
  paymentTerms: string;
  termsAndConditions: string;

  // Status & Client Interaction
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired';
  clientSignature?: {
    signedName: string;
    signedEmail?: string;
    signedAt: Date;
    ipAddress?: string;
  };
  declineReason?: string;
  viewCount: number;
  lastViewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ProposalItemSchema = new Schema({
  title: { type: String, default: 'Untitled Deliverable' },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  rate: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 }
});

const ProposalMilestoneSchema = new Schema({
  title: { type: String, default: 'Project Milestone' },
  duration: { type: String, default: '' },
  description: { type: String, default: '' }
});

const ProposalSchema = new Schema<IProposal>(
  {
    proposalNumber: { type: String, required: true, unique: true, index: true },
    slug: { type: String, index: true, sparse: true, trim: true },
    title: { type: String, required: true, trim: true },
    
    // Company
    companyName: { type: String, default: 'Injaazh Global' },
    companyTagline: { type: String, default: 'Empowering Digital Transformation' },
    companyEmail: { type: String, default: 'hello@injaazh.com' },
    companyWebsite: { type: String, default: 'www.injaazh.com' },
    companyAddress: { type: String, default: '123 Tech Valley, San Francisco, CA 94105' },
    companyPhone: { type: String, default: '+1 (555) 234-5678' },
    companySignature: { type: String, default: 'Injaazh Global Leadership Team' },

    // Client
    clientName: { type: String, required: true, trim: true },
    clientCompany: { type: String, default: '' },
    clientEmail: { type: String, default: '', trim: true },
    clientAddress: { type: String, default: '' },
    clientPhone: { type: String, default: '' },

    // Dates & Currency
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: true },
    currency: { type: String, default: '$' },

    // Content
    executiveSummary: { type: String, default: '' },
    deliverablesSummary: { type: String, default: '' },
    items: [ProposalItemSchema],
    milestones: [ProposalMilestoneSchema],

    // Financials
    subtotal: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },

    // Terms
    paymentTerms: { 
      type: String, 
      default: '50% advance upon project initiation, 25% upon milestone review, and 25% upon final deployment.' 
    },
    termsAndConditions: { 
      type: String, 
      default: 'This proposal is valid until the specified date. All work will adhere to Injaazh standard development and confidentiality agreements.' 
    },

    // Status
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired'],
      default: 'Draft',
      index: true
    },
    clientSignature: {
      signedName: { type: String },
      signedEmail: { type: String },
      signedAt: { type: Date },
      ipAddress: { type: String }
    },
    declineReason: { type: String },
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date }
  },
  { timestamps: true }
);

export const Proposal: Model<IProposal> = 
  mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', ProposalSchema);
export default Proposal;

