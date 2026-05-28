import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description?: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed';
  techStack: string[]; // e.g., ['Next.js', 'Laravel', 'SEO']
  assignees: string[]; // User IDs or names
  progress: number; // 0-100
  startDate?: Date;
  deadline?: Date;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  budget?: number;
  clientName?: string;
  attachments: number;
  comments: number;
  leadId?: string; // Link to Lead
  proposalId?: string; // Link to Proposal
  marketplaceProjectId?: string; // Link to Marketplace Project
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['Planning', 'In Progress', 'In Review', 'Completed'],
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
  clientName: { type: String, trim: true },
  attachments: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  leadId: { type: String },
  proposalId: { type: String },
  marketplaceProjectId: { type: String },
}, { timestamps: true });

// Compound index for efficient board queries
ProjectSchema.index({ status: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, deadline: 1 });

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
