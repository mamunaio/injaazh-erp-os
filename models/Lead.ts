import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOutreachLog {
  date: Date;
  method: 'Email' | 'WhatsApp' | 'Facebook' | 'Phone' | 'Note';
  notes: string;
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
  outreach_logs: IOutreachLog[];
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachLogSchema = new Schema<IOutreachLog>({
  date: { type: Date, default: Date.now },
  method: { type: String, enum: ['Email', 'WhatsApp', 'Facebook', 'Phone', 'Note'], required: true },
  notes: { type: String, default: '' },
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
  outreach_logs: [OutreachLogSchema],
  nextFollowUpDate: { type: Date },
}, { timestamps: true });

// Create indexes for duplicate prevention
// Sparse index allows multiple null values but prevents duplicate non-null values
LeadSchema.index({ email: 1 }, { unique: true, sparse: true });
LeadSchema.index({ phone: 1 }, { unique: true, sparse: true });
LeadSchema.index({ company_name: 1 }, { unique: false }); // For faster lookups

// Prevent overwrite model error in Next.js when hot-reloading
export const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
