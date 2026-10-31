import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISeoTask {
  taskId: string;                      // e.g. SEO-001
  priority: 'High' | 'Medium' | 'Low';
  status: 'Verified' | 'Pending' | 'Needs Approval' | 'In Progress';
  workType: 'Review' | 'Audit' | 'Measurement' | 'Implementation' | 'Verification' | 'Content' | 'Research' | 'Reporting';
  pageOrPlatform: string;             // e.g. "Homepage", "/pricing", "GSC", "GBP"
  task: string;                       // e.g. "Restore page-specific titles"
  beforeFinding: string;              // What was observed before
  doneProposedAction: string;         // Action taken or proposed
  whyItMatters: string;               // Commercial and technical SEO rationale
  nextStep: string;                   // Acceptance criteria or next milestone
  owner: string;                      // e.g. "Mamun", "Mamun + Codex"
  loggedDate?: string;                // e.g. "2026-10-28"
  completedDate?: string;             // e.g. "2026-10-28"
  evidence?: string;                  // URL, screenshot note, or public HTML check
  approvalScope: string;              // e.g. "Not required", "Required", "User implemented", "Not yet applied"
  clientApprovedAt?: Date;
  clientNotes?: string;
}

export interface IKeywordMapping {
  _id?: string;
  keyword: string;
  keywordType: 'Primary' | 'Secondary';
  searchIntent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  targetUrl: string;
  targetLocation: string;
  searchVolume: number;
  keywordDifficulty: number;
  currentPosition?: number | null;
  targetPosition?: number | null;
  priority: 'High' | 'Medium' | 'Low';
  mappingStatus: 'Mapped' | 'Not Mapped' | 'Needs Review';
  notes?: string;
  lastUpdated?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISeoReport {
  _id?: string;
  reportId: string;                    // e.g. "REP-2026-001"
  sprintTitle: string;                 // e.g. "Sprint 01: Baseline Audit & Technical Implementations"
  reportingDate: string;               // e.g. "2026-10-28"
  accountCadence: string;              // e.g. "Weekly Sprint"
  executiveSummary?: string;           // Overall narrative and focus
  highlights?: string[];               // Key wins / accomplishments
  nextSprintFocus?: string;            // Upcoming sprint priorities
  status: 'Published' | 'Draft';
  tasksSnapshot: ISeoTask[];           // Frozen snapshot of tasks at report time
  baselineSnapshot?: any;
  vitalsSnapshot?: any;
  lighthouseSnapshot?: any;
  aeoSnapshot?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISeoProject extends Document {
  docNumber: string;                  // e.g. SEO-2026-001
  slug: string;                       // URL friendly unique slug, e.g. hector-rivera-photography
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  url: string;
  status: 'Active' | 'Paused' | 'Completed';
  cadence?: string;                   // 'Weekly' | 'Bi-weekly' | 'Monthly'
  targetLocation?: string;            // e.g. 'New Jersey, US'
  lastAudited: string;
  isDeleted?: boolean;

  // Real-time Lighthouse & Core Web Vitals
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  vitals: {
    lcp: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
    cls: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
    inp: { value: number; unit: string; status: 'Passed' | 'Needs Improvement' | 'Failed' };
  };

  // AI Search Engine Optimization (AEO)
  aeo: {
    chatgptMentions: number;
    chatgptTrend: 'up' | 'down' | 'flat';
    chatgptTrendValue: number;
    perplexityScore: number;
    perplexityTrend: 'up' | 'down' | 'flat';
    perplexityTrendValue: number;
    historicalData: Array<{ date: string; chatgpt: number; perplexity: number }>;
  };

  // Structured Execution Tasks Matrix
  tasks: ISeoTask[];

  // Target Keyword Mapping & Ranking Tracking
  keywords: IKeywordMapping[];

  // Historical / Weekly Reports Associated with this Project
  reports: ISeoReport[];

  // Benchmarks & Baseline Source Observations (GSC, GBP, PageSpeed, Squarespace)
  baseline: {
    gsc: {
      period: string;
      organicClicks: number;
      impressions: number;
      ctr: number;
      averagePosition: number;
      exactBrandClicks: number;
      exactBrandShare: number;
    };
    gbp: {
      period: string;
      profileViews: number;
      profileInteractions: number;
      calls: number;
      websiteClicks: number;
      directionRequests: number;
      chatClicks: number;
      reportedBookings: number;
    };
    pageSpeed: {
      mobile: { performance: number; fcp: number; lcp: number; tbt: number; cls: number };
      desktop: { performance: number; fcp: number; lcp: number; tbt: number; cls: number };
    };
    onSite: {
      platform: string;
      pagesWithMetadata: number;
      totalPages?: number;
      imagesWithAlt: number;
      totalImages?: number;
    };
  };

  weeklyNotes?: string;
  viewCount: number;
  lastViewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const SeoTaskSchema = new Schema<ISeoTask>(
  {
    taskId: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Verified', 'Pending', 'Needs Approval', 'In Progress'], default: 'Pending' },
    workType: { 
      type: String, 
      enum: ['Review', 'Audit', 'Measurement', 'Implementation', 'Verification', 'Content', 'Research', 'Reporting'], 
      default: 'Audit' 
    },
    pageOrPlatform: { type: String, default: '' },
    task: { type: String, required: true, trim: true },
    beforeFinding: { type: String, default: '' },
    doneProposedAction: { type: String, default: '' },
    whyItMatters: { type: String, default: '' },
    nextStep: { type: String, default: '' },
    owner: { type: String, default: 'Team' },
    loggedDate: { type: String, default: '' },
    completedDate: { type: String, default: '' },
    evidence: { type: String, default: '' },
    approvalScope: { type: String, default: 'Not required' },
    clientApprovedAt: { type: Date },
    clientNotes: { type: String, default: '' },
  },
  { _id: true }
);

const SeoReportSchema = new Schema<ISeoReport>(
  {
    reportId: { type: String, required: true, trim: true },
    sprintTitle: { type: String, required: true, trim: true },
    reportingDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    accountCadence: { type: String, default: 'Weekly Sprint' },
    executiveSummary: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    nextSprintFocus: { type: String, default: '' },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Published' },
    tasksSnapshot: { type: [SeoTaskSchema], default: [] },
    baselineSnapshot: { type: Schema.Types.Mixed, default: {} },
    vitalsSnapshot: { type: Schema.Types.Mixed, default: {} },
    lighthouseSnapshot: { type: Schema.Types.Mixed, default: {} },
    aeoSnapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const KeywordMappingSchema = new Schema<IKeywordMapping>(
  {
    keyword: { type: String, required: true, trim: true },
    keywordType: { type: String, enum: ['Primary', 'Secondary'], default: 'Primary' },
    searchIntent: { 
      type: String, 
      enum: ['Informational', 'Commercial', 'Transactional', 'Navigational'], 
      default: 'Commercial' 
    },
    targetUrl: { type: String, default: '', trim: true },
    targetLocation: { type: String, default: 'New Jersey, US', trim: true },
    searchVolume: { type: Number, default: 0 },
    keywordDifficulty: { type: Number, default: 0 },
    currentPosition: { type: Number, default: null },
    targetPosition: { type: Number, default: null },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    mappingStatus: { 
      type: String, 
      enum: ['Mapped', 'Not Mapped', 'Needs Review'], 
      default: 'Not Mapped' 
    },
    notes: { type: String, default: '' },
    lastUpdated: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

const SeoProjectSchema = new Schema<ISeoProject>(
  {
    docNumber: { type: String, default: 'SEO-2026-001', trim: true },
    slug: { type: String, unique: true, index: true, trim: true, lowercase: true },
    clientName: { type: String, required: true, trim: true },
    clientCompany: { type: String, default: '', trim: true },
    clientEmail: { type: String, default: '', trim: true },
    url: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Paused', 'Completed'], default: 'Active' },
    cadence: { type: String, default: 'Weekly' },
    targetLocation: { type: String, default: 'New Jersey, US' },
    isDeleted: { type: Boolean, default: false },
    lastAudited: { type: String, default: () => new Date().toISOString() },

    lighthouse: {
      performance: { type: Number, required: true, default: 90 },
      accessibility: { type: Number, required: true, default: 90 },
      bestPractices: { type: Number, required: true, default: 90 },
      seo: { type: Number, required: true, default: 90 }
    },
    vitals: {
      lcp: {
        value: { type: Number, required: true, default: 2.0 },
        unit: { type: String, required: true, default: 's' },
        status: { type: String, enum: ['Passed', 'Needs Improvement', 'Failed'], required: true, default: 'Passed' }
      },
      cls: {
        value: { type: Number, required: true, default: 0.05 },
        unit: { type: String, required: false, default: '' },
        status: { type: String, enum: ['Passed', 'Needs Improvement', 'Failed'], required: true, default: 'Passed' }
      },
      inp: {
        value: { type: Number, required: true, default: 150 },
        unit: { type: String, required: true, default: 'ms' },
        status: { type: String, enum: ['Passed', 'Needs Improvement', 'Failed'], required: true, default: 'Needs Improvement' }
      }
    },
    aeo: {
      chatgptMentions: { type: Number, required: true, default: 100 },
      chatgptTrend: { type: String, enum: ['up', 'down', 'flat'], required: true, default: 'up' },
      chatgptTrendValue: { type: Number, required: true, default: 10 },
      perplexityScore: { type: Number, required: true, default: 80 },
      perplexityTrend: { type: String, enum: ['up', 'down', 'flat'], required: true, default: 'up' },
      perplexityTrendValue: { type: Number, required: true, default: 5 },
      historicalData: [{
        date: { type: String, required: true },
        chatgpt: { type: Number, required: true },
        perplexity: { type: Number, required: true }
      }]
    },

    tasks: { type: [SeoTaskSchema], default: [] },
    keywords: { type: [KeywordMappingSchema], default: [] },
    reports: { type: [SeoReportSchema], default: [] },

    baseline: {
      gsc: {
        period: { type: String, default: 'Last 3 months / US / Web' },
        organicClicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        ctr: { type: Number, default: 0 },
        averagePosition: { type: Number, default: 0 },
        exactBrandClicks: { type: Number, default: 0 },
        exactBrandShare: { type: Number, default: 0 },
      },
      gbp: {
        period: { type: String, default: 'Oct 2026' },
        profileViews: { type: Number, default: 0 },
        profileInteractions: { type: Number, default: 0 },
        calls: { type: Number, default: 0 },
        websiteClicks: { type: Number, default: 0 },
        directionRequests: { type: Number, default: 0 },
        chatClicks: { type: Number, default: 0 },
        reportedBookings: { type: Number, default: 0 },
      },
      pageSpeed: {
        mobile: {
          performance: { type: Number, default: 48 },
          fcp: { type: Number, default: 5.5 },
          lcp: { type: Number, default: 17.8 },
          tbt: { type: Number, default: 340 },
          cls: { type: Number, default: 0 },
        },
        desktop: {
          performance: { type: Number, default: 44 },
          fcp: { type: Number, default: 0.9 },
          lcp: { type: Number, default: 3.3 },
          tbt: { type: Number, default: 830 },
          cls: { type: Number, default: 0 },
        },
      },
      onSite: {
        platform: { type: String, default: 'Squarespace' },
        pagesWithMetadata: { type: Number, default: 16 },
        totalPages: { type: Number, default: 16 },
        imagesWithAlt: { type: Number, default: 51 },
        totalImages: { type: Number, default: 52 },
      },
    },

    weeklyNotes: { type: String, default: '' },
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent mongoose overwrite model error in development hot-reloading
if (models.SeoProject) {
  delete (models as any).SeoProject;
}

const SeoProject = mongoose.model<ISeoProject>('SeoProject', SeoProjectSchema);
export default SeoProject;
