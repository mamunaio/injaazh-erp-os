import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequirementFeature {
  title: string;
  description?: string;
  priority: 'Must Have' | 'Should Have' | 'Nice to Have';
  status: 'Included' | 'Future Scope' | 'Optional Add-on';
}

export interface IRequirementModule {
  name: string;
  description?: string;
  features: IRequirementFeature[];
}

export interface IClientPrerequisite {
  title: string;
  provided: boolean;
  notes?: string;
}

export interface IProjectRequirement extends Document {
  docNumber: string;                 // e.g. REQ-2026-001
  slug: string;                      // URL friendly slug
  title: string;                     // Project Title
  version: string;                   // e.g. "v1.0"
  
  // Organization info
  companyName: string;
  companyTagline?: string;
  companyEmail: string;
  companyWebsite?: string;

  // Client info
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientPhone?: string;

  // Overview & Tech Stack
  executiveSummary: string;
  targetAudience?: string;
  techStack: string[];

  // Functional Modules & Features
  modules: IRequirementModule[];

  // Deliverables, Prerequisites & Boundaries
  clientPrerequisites: IClientPrerequisite[];
  outOfScope: string[];
  timelineEstimate?: string;

  // Status & Interactions
  status: 'Draft' | 'Sent' | 'In Review' | 'Approved' | 'Changes Requested';
  clientSignoff?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: Date;
    feedbackNotes?: string;
    ipAddress?: string;
  };

  viewCount: number;
  lastViewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const RequirementFeatureSchema = new Schema<IRequirementFeature>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    priority: { 
      type: String, 
      enum: ['Must Have', 'Should Have', 'Nice to Have'], 
      default: 'Must Have' 
    },
    status: { 
      type: String, 
      enum: ['Included', 'Future Scope', 'Optional Add-on'], 
      default: 'Included' 
    },
  },
  { _id: false }
);

const RequirementModuleSchema = new Schema<IRequirementModule>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    features: { type: [RequirementFeatureSchema], default: [] },
  },
  { _id: false }
);

const ClientPrerequisiteSchema = new Schema<IClientPrerequisite>(
  {
    title: { type: String, required: true, trim: true },
    provided: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const ProjectRequirementSchema = new Schema<IProjectRequirement>(
  {
    docNumber: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    slug: { type: String, required: true, index: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    version: { type: String, default: 'v1.0', trim: true },

    companyName: { type: String, default: 'Injaazh Global' },
    companyTagline: { type: String, default: 'Empowering Digital Transformation' },
    companyEmail: { type: String, default: 'hello@injaazh.com' },
    companyWebsite: { type: String, default: 'www.injaazh.com' },

    clientName: { type: String, required: true, trim: true },
    clientCompany: { type: String, trim: true, default: '' },
    clientEmail: { type: String, required: true, trim: true },
    clientPhone: { type: String, trim: true, default: '' },

    executiveSummary: { type: String, default: '', trim: true },
    targetAudience: { type: String, default: '', trim: true },
    techStack: [{ type: String, trim: true }],

    modules: { type: [RequirementModuleSchema], default: [] },
    clientPrerequisites: { type: [ClientPrerequisiteSchema], default: [] },
    outOfScope: [{ type: String, trim: true }],
    timelineEstimate: { type: String, default: '', trim: true },

    status: {
      type: String,
      enum: ['Draft', 'Sent', 'In Review', 'Approved', 'Changes Requested'],
      default: 'Draft',
      index: true,
    },

    clientSignoff: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String, trim: true },
      approvedAt: { type: Date },
      feedbackNotes: { type: String, trim: true },
      ipAddress: { type: String, trim: true },
    },

    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast lookup & filtering
ProjectRequirementSchema.index({ slug: 1 });
ProjectRequirementSchema.index({ docNumber: 1 });
ProjectRequirementSchema.index({ status: 1, createdAt: -1 });

delete (mongoose.models as any).ProjectRequirement;
export const ProjectRequirement: Model<IProjectRequirement> =
  mongoose.models.ProjectRequirement ||
  mongoose.model<IProjectRequirement>('ProjectRequirement', ProjectRequirementSchema);

