import mongoose, { Schema, Document, models } from 'mongoose';

export interface IMarketplaceClient extends Document {
  name: string;
  company?: string;
  email?: string;
  timezone?: string;
  country?: string;
  profileLink?: string;
  profilePic?: string;
  platform: 'Upwork' | 'Freelancer' | 'Fiverr' | 'Direct' | 'Other';
  totalSpent: number;
  leadId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceClientSchema = new Schema<IMarketplaceClient>(
  {
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String },
    timezone: { type: String },
    country: { type: String },
    profileLink: { type: String },
    profilePic: { type: String },
    platform: { 
      type: String, 
      enum: ['Upwork', 'Freelancer', 'Fiverr', 'Direct', 'Other'], 
      default: 'Direct' 
    },
    totalSpent: { type: Number, default: 0 },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    notes: { type: String }
  },
  { timestamps: true }
);

const MarketplaceClient = models.MarketplaceClient || mongoose.model<IMarketplaceClient>('MarketplaceClient', MarketplaceClientSchema);

export default MarketplaceClient;
