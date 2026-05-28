import mongoose, { Schema, Document, models } from 'mongoose';

export interface IMarketplaceProject extends Document {
  title: string;
  platform: 'Upwork' | 'Freelancer' | 'Fiverr' | 'Direct';
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed';
  budget?: string;
  scope?: string;
  tasks: Array<{ id: string | number; title: string; completed: boolean }>;
  milestones: Array<{ id: string | number; description: string; date: string; status: string; amount: number }>;
  files: Array<{ id: string | number; name: string; size: string; category: string; date: string; url: string }>;
  liveLink?: string;
  prototypeLink?: string;
  startDate?: Date;
  deadline?: Date;
  clientDetails: {
    clientName: string;
    company?: string;
    timezone?: string;
  };
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceProjectSchema = new Schema<IMarketplaceProject>(
  {
    title: { type: String, required: true },
    platform: { 
      type: String, 
      enum: ['Upwork', 'Freelancer', 'Fiverr', 'Direct'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Planning', 'In Progress', 'In Review', 'Completed'], 
      default: 'Planning' 
    },
    budget: { type: String },
    scope: { type: String },
    tasks: [{
      id: { type: Schema.Types.Mixed },
      title: { type: String },
      completed: { type: Boolean, default: false }
    }],
    milestones: [{
      id: { type: Schema.Types.Mixed },
      description: { type: String },
      date: { type: String },
      status: { type: String },
      amount: { type: Number }
    }],
    files: [{
      id: { type: Schema.Types.Mixed },
      name: { type: String },
      size: { type: String },
      category: { type: String },
      date: { type: String },
      url: { type: String }
    }],
    liveLink: { type: String },
    prototypeLink: { type: String },
    startDate: { type: Date },
    deadline: { type: Date },
    clientDetails: {
      clientName: { type: String, required: true },
      company: { type: String },
      timezone: { type: String },
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

const MarketplaceProject = models.MarketplaceProject || mongoose.model<IMarketplaceProject>('MarketplaceProject', MarketplaceProjectSchema);

export default MarketplaceProject;
