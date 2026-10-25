export type ProjectStatus = 'In Progress' | 'Planning' | 'Completed' | 'On Hold';

export interface ProjectLogItem {
  text: string;
  completed: boolean;
}

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  quarter?: string;
  tag?: string;
  logs?: ProjectLogItem[];
}

export interface RoadmapCategory {
  category: string;
  projects: Project[];
}

export const roadmapData: RoadmapCategory[] = [
  {
    category: "Core ERP & Operating System",
    projects: [
      {
        id: 1,
        name: "Injaazh Global ERP Core Engine & Executive Suite",
        status: "Completed",
        quarter: "Q1 2026",
        tag: "Core Architecture",
        logs: [
          { text: "Next.js 15 App Router & React 19 Engine Architecture", completed: true },
          { text: "MongoDB Multi-Tenant Database & Role Authorization", completed: true },
          { text: "Islamic Daily Splash Modal & Executive Header System", completed: true },
          { text: "Universal DropdownPortal & Dark Mode Glass Design System", completed: true }
        ]
      },
      {
        id: 2,
        name: "Double-Entry Financial & Expense Analytics Engine",
        status: "In Progress",
        quarter: "Q1 2026",
        tag: "Finance",
        logs: [
          { text: "Daily Expense Tracking & Category Classification", completed: true },
          { text: "Lend / Borrow Debt Tracking Ledger", completed: true },
          { text: "Multi-Currency Cash Flow & Realtime Balance Telemetry", completed: true },
          { text: "Automated Profit & Loss Statement PDF Exporter", completed: false }
        ]
      },
      {
        id: 3,
        name: "Real-Time Sprint Tasks & Lifetime Work Audit Log",
        status: "Completed",
        quarter: "Q1 2026",
        tag: "Operations",
        logs: [
          { text: "Today's In-Flight Queue & Instant Priority Toggles", completed: true },
          { text: "Lifetime Work History Chronological Timeline", completed: true },
          { text: "Executive Work Telemetry KPI 6-Grid", completed: true },
          { text: "Work Log CSV Exporter & Portal Dropdown Filters", completed: true }
        ]
      },
      {
        id: 4,
        name: "Lead Gen Outreach Pipeline & 24/7 Automation",
        status: "In Progress",
        quarter: "Q1 2026",
        tag: "Growth",
        logs: [
          { text: "Prospect Kanban Pipeline & Conversion Funnel", completed: true },
          { text: "Automated Cold Email Cron Engine & Spintax", completed: true },
          { text: "Delivery Calendar & SOP Standard Operations Hub", completed: true },
          { text: "Lead Scoring & Auto-Enrichment via Apollo API", completed: false }
        ]
      },
      {
        id: 5,
        name: "Marketplace & Client Freelance Operations Engine",
        status: "In Progress",
        quarter: "Q2 2026",
        tag: "Delivery",
        logs: [
          { text: "Upwork & Direct Client Contract Hub", completed: true },
          { text: "Milestone Deliverables & Escrow Payment Tracking", completed: true },
          { text: "Interactive Kanban Cards & Deadline Alerts", completed: true },
          { text: "Automated Client Work Proof Submission Generator", completed: false }
        ]
      },
      {
        id: 6,
        name: "White-Label Client Portal & Self-Service Invoicing SaaS",
        status: "Planning",
        quarter: "Q2 2026",
        tag: "SaaS Product",
        logs: [
          { text: "Secure Client Login & Project Progress Dashboard", completed: false },
          { text: "Stripe & PayPal Automated Recurring Payment Gateway", completed: false },
          { text: "Downloadable PDF Invoices with Digital Verification", completed: false }
        ]
      }
    ]
  },
  {
    category: "AI Copilots & Automation Engines",
    projects: [
      {
        id: 7,
        name: "Injaazh Global AI Copilot with Deep Context Chat",
        status: "In Progress",
        quarter: "Q1 2026",
        tag: "AI Architecture",
        logs: [
          { text: "Gemini 2.5 Pro Agentic System Architecture", completed: true },
          { text: "Floating Dispatch Modal & Keyboard ⌘K Integration", completed: true },
          { text: "ERP Context Injection (Financials, Tasks, Projects)", completed: true },
          { text: "Voice Command & Audio-to-Action Transcriber", completed: false }
        ]
      },
      {
        id: 8,
        name: "Autonomous Cold Outreach & Multi-Inbox Email Bot",
        status: "In Progress",
        quarter: "Q1 2026",
        tag: "AI Automation",
        logs: [
          { text: "Multi-Account SMTP Warmup & Throttle Management", completed: true },
          { text: "Dynamic AI Lead Personalization Engine", completed: true },
          { text: "Automatic Reply Classification & Follow-Up Triggers", completed: false }
        ]
      },
      {
        id: 9,
        name: "Predictive Financial P&L & Cash Flow Forecaster",
        status: "Planning",
        quarter: "Q2 2026",
        tag: "AI Analytics",
        logs: [
          { text: "Historical Revenue Run-Rate Trend Extrapolation", completed: false },
          { text: "Expense Anomaly & Unused Subscription Detection", completed: false },
          { text: "Break-Even & Hiring Budget Simulation Engine", completed: false }
        ]
      },
      {
        id: 10,
        name: "AI Upwork Proposal & Winning Pitch Generator",
        status: "Planning",
        quarter: "Q2 2026",
        tag: "Marketplace AI",
        logs: [
          { text: "Upwork Job Spec Keyword & Requirement Extractor", completed: false },
          { text: "Semantic Portfolio Matching & Proof Insertion", completed: false },
          { text: "High-Converting Proposal Draft Generator in 30 Seconds", completed: false }
        ]
      }
    ]
  },
  {
    category: "Healthcare & Clinic SaaS Ecosystem",
    projects: [
      {
        id: 11,
        name: "Doctor Appointment & Smart Waiting Room Queue System",
        status: "In Progress",
        quarter: "Q2 2026",
        tag: "Healthcare SaaS",
        logs: [
          { text: "Doctor Weekly Roster & Slot Reservation Engine", completed: true },
          { text: "Real-Time Patient Token Display Board", completed: false },
          { text: "WhatsApp & SMS Automated Appointment Reminders", completed: false }
        ]
      },
      {
        id: 12,
        name: "Full Cloud Clinic Management & E-Prescription Portal",
        status: "Planning",
        quarter: "Q3 2026",
        tag: "EHR / EMR",
        logs: [
          { text: "Digital Medical History & Prescription Generator", completed: false },
          { text: "Diagnostic Lab Reports & Imaging Attachment Cloud", completed: false },
          { text: "Billing, Medicine Billing & OPD Receipt Manager", completed: false }
        ]
      },
      {
        id: 13,
        name: "Cloud Pharmacy Inventory & Automated Rx Dispenser",
        status: "Planning",
        quarter: "Q3 2026",
        tag: "Pharma",
        logs: [
          { text: "Medicine Batch Number & Expiry Date Alerting", completed: false },
          { text: "POS Fast Barcode Scanning & Wholesale Purchase Invoicing", completed: false }
        ]
      }
    ]
  },
  {
    category: "Education & Digital Ecosystems",
    projects: [
      {
        id: 14,
        name: "Injaazh Academy LMS (Learning Management Platform)",
        status: "In Progress",
        quarter: "Q2 2026",
        tag: "EdTech",
        logs: [
          { text: "Multi-Tier Video Course Player & Lesson Progression", completed: true },
          { text: "Student Assignment Upload & Instructor Review Hub", completed: false },
          { text: "Automated Certificate Issuance with QR Verification", completed: false }
        ]
      },
      {
        id: 15,
        name: "Secure Online Examination & Assessment Engine",
        status: "Planning",
        quarter: "Q3 2026",
        tag: "EdTech",
        logs: [
          { text: "Timed Multiple Choice Quiz & Coding Challenge Sandbox", completed: false },
          { text: "Anti-Cheating Window Blur Detection & Live Webcam Proctoring", completed: false },
          { text: "Automated Marksheet & Rank Distribution Analytics", completed: false }
        ]
      }
    ]
  },
  {
    category: "Mobile & Cross-Platform Suite",
    projects: [
      {
        id: 16,
        name: "Injaazh Executive Suite Mobile App (Expo / React Native)",
        status: "In Progress",
        quarter: "Q2 2026",
        tag: "Mobile OS",
        logs: [
          { text: "Biometric FaceID / Fingerprint Quick Unlock", completed: true },
          { text: "Realtime Executive KPI Widgets & Dark Mode Sync", completed: true },
          { text: "Instant Push Notifications for Leads, Tasks & Payments", completed: false }
        ]
      },
      {
        id: 17,
        name: "Offline-First Background Sync & Local PWA Cache",
        status: "Planning",
        quarter: "Q3 2026",
        tag: "Performance",
        logs: [
          { text: "IndexedDB Local Data Store for Zero-Latency Operation", completed: false },
          { text: "Service Worker Background Sync with Conflict Resolution", completed: false }
        ]
      }
    ]
  }
];
