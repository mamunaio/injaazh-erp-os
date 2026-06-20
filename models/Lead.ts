import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOutreachLog {
  date: Date;
  method: 'Email' | 'WhatsApp' | 'Facebook' | 'Phone' | 'Note';
  notes: string;
  loggedBy?: mongoose.Types.ObjectId;
}

export interface ILead extends Document {
  company_name: string;
  contact_person?: string;
  source: string; // e.g., Google, Facebook, Upwork
  outreach_status: 'New' | 'Contacted' | 'Replied' | 'Meeting Booked' | 'Closed' | 'Not Interested';
  website_url?: string;
  email?: string;
  phone?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  targetService?: 'High-end Web Development' | 'Next.js / Laravel App' | 'WordPress Development' | 'Custom ERP / SaaS' | 'Technical SEO' | 'Answer Engine Optimization (AEO)' | 'Generative Engine Optimization (GEO)' | 'UI/UX Design';
  reportFileUrl?: string;
  lead_context?: string;
  email_draft?: string;
  email_subject_draft?: string;
  outreach_logs: IOutreachLog[];
  nextFollowUpDate?: Date;
  timezone?: string;
  outreach_scheduled_for?: Date;
  follow_up_count: number;
  last_contacted_date?: Date;
  is_replied: boolean;
  last_reply_subject?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachLogSchema = new Schema<IOutreachLog>({
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ['Email', 'WhatsApp', 'Facebook', 'Phone', 'Note'], required: true },
  notes: { type: String, default: '' },
  loggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const LeadSchema = new Schema<ILead>({
  company_name: { type: String, required: true, trim: true },
  contact_person: { type: String, trim: true },
  source: { type: String, default: 'Manual' },
  outreach_status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'],
    default: 'New'
  },
  website_url: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  facebook_url: { type: String, trim: true },
  instagram_url: { type: String, trim: true },
  linkedin_url: { type: String, trim: true },
  targetService: { 
    type: String, 
    enum: ['High-end Web Development', 'Next.js / Laravel App', 'WordPress Development', 'Custom ERP / SaaS', 'Technical SEO', 'Answer Engine Optimization (AEO)', 'Generative Engine Optimization (GEO)', 'UI/UX Design'],
    default: 'High-end Web Development'
  },
  reportFileUrl: { type: String, trim: true },
  lead_context: { type: String, trim: true },
  email_draft: { type: String },
  email_subject_draft: { type: String },
  outreach_logs: [OutreachLogSchema],
  nextFollowUpDate: { type: Date },
  timezone: { type: String, default: 'EST' },
  outreach_scheduled_for: { type: Date },
  follow_up_count: { type: Number, default: 0 },
  last_contacted_date: { type: Date },
  is_replied: { type: Boolean, default: false },
  last_reply_subject: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Create indexes for duplicate prevention
// Sparse index allows multiple null values but prevents duplicate non-null values
LeadSchema.index({ email: 1 }, { unique: true, sparse: true });
LeadSchema.index({ phone: 1 }, { unique: true, sparse: true });
LeadSchema.index({ company_name: 1 }, { unique: false }); // For faster lookups

// Prevent overwrite model error in Next.js when hot-reloading
export const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
