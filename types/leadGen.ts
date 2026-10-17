export type ProspectStatus =
  | 'New'
  | 'Verified'
  | 'Email 1 sent'
  | 'Follow-up 1'
  | 'Follow-up 2'
  | 'Reply received'
  | 'Audit sent'
  | 'Call booked'
  | 'Won'
  | 'Lost'
  | 'Suppressed';

export type ReplyTag = 'None' | 'Positive' | 'Neutral' | 'Negative' | 'Unsubscribe';

export interface Prospect {
  id: string;
  company: string;
  city: string;
  state: string;
  website: string;
  businessEmail: string;
  emailVerified: 'Yes' | 'No' | 'Pending';
  mapsRank: string;
  reviewCount: number;
  rating: number;
  gap: string;
  screenshotLink?: string;
  status: ProspectStatus;
  replyTag: ReplyTag;
  lastContact?: string;
  nextFollowUp?: string;
  notes?: string;
  createdAt?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  emailsSent: number;
  bounced: number;
  replies: number;
  positiveReplies: number;
  auditsSent: number;
  callsBooked: number;
  note?: string;
  bounceRate?: number;
  replyRate?: number;
  positiveRate?: number;
}

export interface Client {
  id: string;
  name: string;
  startDate: string;
  monthlyRetainer: number;
  services: string;
  hoursReportMonth?: number;
  effectiveHourlyRate?: number;
  status: 'Active' | 'Paused' | 'Churned' | 'Example';
  notes?: string;
}

export interface TimeLog {
  id: string;
  date: string;
  person: string;
  client: string;
  lane: 'Outreach' | 'Fulfillment' | 'Tech' | 'Strategy' | 'Admin';
  hours: number;
  task: string;
  note?: string;
}

export interface TeamTask {
  id: string;
  task: string;
  lane: 'Outreach' | 'Fulfillment' | 'Tech' | 'Content' | 'Admin';
  owner: string;
  created: string;
  deadline: string;
  status: 'Todo' | 'In Progress' | 'Done' | 'Blocked';
  reviewedByMe: boolean;
  briefLink?: string;
  flag: 'Normal' | 'Urgent' | 'Blocked';
  notes?: string;
}

export interface DeliveryItem {
  id: string;
  client: string;
  task: string;
  frequency: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Bi-annual';
  lastDone?: string;
  nextDue: string;
  status: 'Due soon' | 'Overdue' | 'Good' | 'Completed';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  client: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: string;
  paidDate?: string | null;
  note?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  vendor: string;
  amount: number;
  isRecurring: boolean;
  note?: string;
}

export interface SystemSettings {
  agencyName: string;
  niche: string;
  maxBounceRate: number; // e.g. 0.02 (2%)
  minPositiveReplyRate: number; // e.g. 0.01 (1%)
  targetColdEmails30DaysLow: number; // e.g. 300
  targetColdEmails30DaysHigh: number; // e.g. 500
  targetMrrMonth6: number; // e.g. 3000
  targetMrrMonth12: number; // e.g. 6000
  hourlyFloorRate: number; // e.g. 25
  reportMonth: string; // e.g. "2026-10"
  mongoUri?: string;
  mongoConnected?: boolean;
}

export interface DatabaseState {
  settings: SystemSettings;
  prospects: Prospect[];
  dailyLogs: DailyLog[];
  clients: Client[];
  timeLogs: TimeLog[];
  teamTasks: TeamTask[];
  deliveryCalendar: DeliveryItem[];
  invoices: Invoice[];
  expenses: Expense[];
}
