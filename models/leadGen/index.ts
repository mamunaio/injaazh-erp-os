import mongoose, { Schema, Model } from 'mongoose';
import {
  Prospect,
  DailyLog,
  Client,
  TimeLog,
  TeamTask,
  DeliveryItem,
  Invoice,
  Expense,
  SystemSettings,
} from '@/types/leadGen';

// Prospect Schema
const ProspectSchema = new Schema<Prospect>(
  {
    id: { type: String, required: true, unique: true },
    company: { type: String, required: true },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    website: { type: String, default: '' },
    businessEmail: { type: String, required: true },
    emailVerified: { type: String, enum: ['Yes', 'No', 'Pending'], default: 'Pending' },
    mapsRank: { type: String, default: '' },
    reviewCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    gap: { type: String, default: '' },
    screenshotLink: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'New',
        'Verified',
        'Email 1 sent',
        'Follow-up 1',
        'Follow-up 2',
        'Reply received',
        'Audit sent',
        'Call booked',
        'Won',
        'Lost',
        'Suppressed',
      ],
      default: 'New',
    },
    replyTag: {
      type: String,
      enum: ['None', 'Positive', 'Neutral', 'Negative', 'Unsubscribe'],
      default: 'None',
    },
    lastContact: { type: String, default: '' },
    nextFollowUp: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// DailyLog Schema
const DailyLogSchema = new Schema<DailyLog>(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    emailsSent: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    positiveReplies: { type: Number, default: 0 },
    auditsSent: { type: Number, default: 0 },
    callsBooked: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Client Schema
const ClientSchema = new Schema<Client>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    startDate: { type: String, required: true },
    monthlyRetainer: { type: Number, required: true },
    services: { type: String, default: '' },
    hoursReportMonth: { type: Number, default: 0 },
    effectiveHourlyRate: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Paused', 'Churned', 'Example'], default: 'Active' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// TimeLog Schema
const TimeLogSchema = new Schema<TimeLog>(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    person: { type: String, required: true },
    client: { type: String, required: true },
    lane: {
      type: String,
      enum: ['Outreach', 'Fulfillment', 'Tech', 'Strategy', 'Admin'],
      default: 'Outreach',
    },
    hours: { type: Number, required: true },
    task: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// TeamTask Schema
const TeamTaskSchema = new Schema<TeamTask>(
  {
    id: { type: String, required: true, unique: true },
    task: { type: String, required: true },
    lane: {
      type: String,
      enum: ['Outreach', 'Fulfillment', 'Tech', 'Content', 'Admin'],
      default: 'Outreach',
    },
    owner: { type: String, required: true },
    created: { type: String, required: true },
    deadline: { type: String, required: true },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Done', 'Blocked'],
      default: 'Todo',
    },
    reviewedByMe: { type: Boolean, default: false },
    briefLink: { type: String, default: '' },
    flag: { type: String, enum: ['Normal', 'Urgent', 'Blocked'], default: 'Normal' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// DeliveryItem Schema
const DeliveryItemSchema = new Schema<DeliveryItem>(
  {
    id: { type: String, required: true, unique: true },
    client: { type: String, required: true },
    task: { type: String, required: true },
    frequency: {
      type: String,
      enum: ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Bi-annual'],
      default: 'Weekly',
    },
    lastDone: { type: String, default: '' },
    nextDue: { type: String, required: true },
    status: {
      type: String,
      enum: ['Due soon', 'Overdue', 'Good', 'Completed'],
      default: 'Good',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Invoice Schema
const InvoiceSchema = new Schema<Invoice>(
  {
    id: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, required: true },
    issueDate: { type: String, required: true },
    client: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue'],
      default: 'Draft',
    },
    dueDate: { type: String, required: true },
    paidDate: { type: String, default: null },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Expense Schema
const ExpenseSchema = new Schema<Expense>(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    category: { type: String, required: true },
    vendor: { type: String, required: true },
    amount: { type: Number, required: true },
    isRecurring: { type: Boolean, default: false },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Settings Schema
const SettingsSchema = new Schema<SystemSettings>(
  {
    agencyName: { type: String, default: 'Injaazh US HVAC Growth' },
    niche: { type: String, default: 'US HVAC Contractors & Services' },
    maxBounceRate: { type: Number, default: 0.02 },
    minPositiveReplyRate: { type: Number, default: 0.01 },
    targetColdEmails30DaysLow: { type: Number, default: 300 },
    targetColdEmails30DaysHigh: { type: Number, default: 500 },
    targetMrrMonth6: { type: Number, default: 3000 },
    targetMrrMonth12: { type: Number, default: 6000 },
    hourlyFloorRate: { type: Number, default: 25 },
    reportMonth: { type: String, default: '2026-10' },
  },
  { timestamps: true }
);

// Isolated Mongoose model names to prevent collision with ERP models
export const LeadGenProspectModel: Model<Prospect> =
  mongoose.models.LeadGenProspect || mongoose.model<Prospect>('LeadGenProspect', ProspectSchema, 'leadgen_prospects');

export const LeadGenDailyLogModel: Model<DailyLog> =
  mongoose.models.LeadGenDailyLog || mongoose.model<DailyLog>('LeadGenDailyLog', DailyLogSchema, 'leadgen_dailylogs');

export const LeadGenClientModel: Model<Client> =
  mongoose.models.LeadGenClient || mongoose.model<Client>('LeadGenClient', ClientSchema, 'leadgen_clients');

export const LeadGenTimeLogModel: Model<TimeLog> =
  mongoose.models.LeadGenTimeLog || mongoose.model<TimeLog>('LeadGenTimeLog', TimeLogSchema, 'leadgen_timelogs');

export const LeadGenTeamTaskModel: Model<TeamTask> =
  mongoose.models.LeadGenTeamTask || mongoose.model<TeamTask>('LeadGenTeamTask', TeamTaskSchema, 'leadgen_tasks');

export const LeadGenDeliveryItemModel: Model<DeliveryItem> =
  mongoose.models.LeadGenDeliveryItem || mongoose.model<DeliveryItem>('LeadGenDeliveryItem', DeliveryItemSchema, 'leadgen_delivery_items');

export const LeadGenInvoiceModel: Model<Invoice> =
  mongoose.models.LeadGenInvoice || mongoose.model<Invoice>('LeadGenInvoice', InvoiceSchema, 'leadgen_invoices');

export const LeadGenExpenseModel: Model<Expense> =
  mongoose.models.LeadGenExpense || mongoose.model<Expense>('LeadGenExpense', ExpenseSchema, 'leadgen_expenses');

export const LeadGenSettingsModel: Model<SystemSettings> =
  mongoose.models.LeadGenSettings || mongoose.model<SystemSettings>('LeadGenSettings', SettingsSchema, 'leadgen_settings');
