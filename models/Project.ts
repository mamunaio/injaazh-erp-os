import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description?: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold' | 'Cancelled';
  techStack: string[]; // e.g., ['Next.js', 'Laravel', 'SEO']
  assignees: string[]; // User IDs or names
  progress: number; // 0-100
  startDate?: Date;
  deadline?: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  budget?: number;
  platform?: 'Upwork' | 'Freelancer' | 'Fiverr' | 'Direct' | 'Other';
  platformFee?: number;
  clientId?: mongoose.Types.ObjectId;
  clientName?: string;
  leadId?: mongoose.Types.ObjectId;
  proposalId?: mongoose.Types.ObjectId;
  marketplaceProjectId?: mongoose.Types.ObjectId;
  attachments?: number;
  comments?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Planning',
    index: true // Index for fast filtering
  },
  techStack: [{ type: String }],
  assignees: [{ type: String }],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  startDate: { type: Date },
  deadline: { type: Date, index: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  tags: [{ type: String }],
  budget: { type: Number },
  platform: { 
    type: String, 
    enum: ['Upwork', 'Freelancer', 'Fiverr', 'Direct', 'Other'] 
  },
  platformFee: { type: Number },
  clientId: { type: Schema.Types.ObjectId, ref: 'MarketplaceClient' },
  clientName: { type: String },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  proposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
  marketplaceProjectId: { type: Schema.Types.ObjectId, ref: 'MarketplaceProject' },
  attachments: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
}, { timestamps: true });

// Compound index for efficient board queries
ProjectSchema.index({ status: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, deadline: 1 });

delete mongoose.models.Project;
export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
