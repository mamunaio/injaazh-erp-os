'use server';

import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';
import MarketplaceProject from '@/models/MarketplaceProject';
import { Transaction } from '@/models/Transaction';
import { generateAIContent } from '@/lib/aiProvider';
import { getAuthUser } from '@/lib/auth';

/**
 * Generate Project Sprint Task Breakdown
 */
export async function generateProjectTaskChecklist(params: {
  projectTitle: string;
  description?: string;
  techStack?: string[];
}) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const prompt = `You are a Technical Project Manager.
Break down the following project into 5-8 actionable sprint tasks:

- Project: ${params.projectTitle}
- Overview: ${params.description || 'Enterprise web & SaaS deliverable'}
- Tech Stack: ${(params.techStack || ['Next.js', 'TypeScript', 'MongoDB']).join(', ')}

OUTPUT STRICT JSON:
{
  "tasks": [
    {
      "title": "Task title (e.g. Set up authentication & role-based middleware)",
      "priority": "High" | "Medium" | "Low",
      "estimatedHours": 4
    }
  ]
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to generate tasks' };
    }

    const data = JSON.parse(result.text);
    return { success: true, tasks: data.tasks || [] };
  } catch (error: any) {
    console.error('generateProjectTaskChecklist error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * Dynamic Realtime AI Executive Briefing for Dashboard
 */
export async function getRealtimeAiExecutiveBriefing() {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const [projects, marketplaceProjects, transactions] = await Promise.all([
      Project.find({ status: { $in: ['In Progress', 'In Review', 'Planning'] } }).lean(),
      MarketplaceProject.find({ status: { $in: ['In Progress', 'In Review', 'Planning'] } }).lean(),
      Transaction.find({}).sort({ date: -1 }).limit(10).lean(),
    ]);

    const totalActiveProjects = projects.length + marketplaceProjects.length;
    let pendingMilestoneValue = 0;
    marketplaceProjects.forEach((mp: any) => {
      if (mp.milestones && Array.isArray(mp.milestones)) {
        mp.milestones.forEach((m: any) => {
          if (m.status === 'Pending') pendingMilestoneValue += parseFloat(m.amount) || 0;
        });
      }
    });

    const incomeTransactions = transactions.filter((t: any) => t.type === 'Income' || t.type === 'income');
    const totalIncomeMonth = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const prompt = `You are the AI Executive Chief of Staff for Injaazh ERP OS (Freelancer & Marketplace Management).
Analyze this real-time enterprise snapshot and deliver an ultra-sharp, actionable business intelligence summary:

SNAPSHOT:
- Active Client & Marketplace Projects: ${totalActiveProjects}
- Pending Milestone Escrow: $${pendingMilestoneValue.toLocaleString()}
- Recent Income Recorded: $${totalIncomeMonth.toLocaleString()}

INSTRUCTIONS:
Provide a concise, motivating executive summary with exactly 2-3 sentences. Mention the financial trajectory, high-priority focus for today, and one concrete milestone delivery action.`;

    const result = await generateAIContent({ prompt });
    if (!result.success || !result.text) {
      return { 
        success: true, 
        text: `You have ${totalActiveProjects} active projects with $${pendingMilestoneValue.toLocaleString()} in pending milestones. Focus today on client deliverables and milestone completion.` 
      };
    }

    return { success: true, text: result.text.trim() };
  } catch (error: any) {
    console.error('getRealtimeAiExecutiveBriefing error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 8. AI Financial Health & Cash Flow Diagnostic
 */
export async function analyzeFinancialHealth(params: {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMarginPercent: number;
  timeframe: string;
  topCategories?: { name: string; amount: number }[];
  platformBreakdown?: { [key: string]: number };
}) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const prompt = `You are a Fractional CFO and AI Financial Strategist for a fast-growing digital agency/consultancy (Injaazh Global).
Analyze the following financial snapshot and provide an executive diagnostic report:

FINANCIAL METRICS (${params.timeframe}):
- Total Income / Revenue: $${params.totalIncome.toLocaleString()}
- Total Expenses: $${params.totalExpense.toLocaleString()}
- Net Profit: $${params.netProfit.toLocaleString()}
- Profit Margin: ${params.profitMarginPercent.toFixed(1)}%
${params.topCategories && params.topCategories.length > 0 ? `- Top Expense/Income Categories: ${JSON.stringify(params.topCategories)}` : ''}
${params.platformBreakdown ? `- Platform Revenue Sources: ${JSON.stringify(params.platformBreakdown)}` : ''}

OUTPUT STRICT JSON WITH THIS STRUCTURE:
{
  "financialHealthScore": 88,
  "cashFlowStatus": "Healthy",
  "burnRateAssessment": "Short 1-2 sentence assessment of monthly burn rate vs revenue",
  "marginAnalysis": "Short evaluation of current profit margin",
  "strategicRecommendations": [
    "Actionable bullet 1",
    "Actionable bullet 2",
    "Actionable bullet 3"
  ],
  "growthOpportunity": "A clear actionable strategy to boost net cash flow by 15-25% in the next quarter"
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to generate financial diagnostic' };
    }

    const data = JSON.parse(result.text);
    return { success: true, data };
  } catch (error: any) {
    console.error('analyzeFinancialHealth error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 9. AI Scope & Deliverable Specifications Generator for Marketplace Projects
 */
export async function generateMarketplaceProjectScope(params: {
  projectTitle: string;
  clientName?: string;
  platform?: string;
  budget?: string;
  currentScope?: string;
  target?: 'scope' | 'tasks' | 'both';
}) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const prompt = `You are an elite Digital Agency Delivery Director and Senior Project Manager.
Analyze this project title, client, and parameters, and generate an executive-quality Project Scope Statement and Sprint Delivery Milestones:

- Project Title: ${params.projectTitle}
- Client Name / Company: ${params.clientName || 'Direct Client'}
- Marketplace Platform / Channel: ${params.platform || 'Direct'}
- Contract Budget: ${params.budget ? `$${params.budget}` : 'Agreed contract rate'}
${params.currentScope ? `- Current Notes / Scope Context: ${params.currentScope}` : ''}

CRITICAL FORMATTING INSTRUCTIONS FOR "scope":
DO NOT write an unbroken wall of text.
Structure the scope into 4-5 clearly labeled bullet sections separated by double newlines (\n\n):
• Project Mission & Objectives: [High-level overview and core purpose for this client deliverable]

• Architecture & UI/UX Design: [Design system, responsiveness across devices, clean user journey]

• Core Features & Deliverables: [Key functionality, workflows, database/API models, content presentation]

• Scope Boundaries & Integrations: [Key boundaries, third-party APIs/analytics, communication mechanisms]

• Quality Assurance & Handover: [Cross-browser testing, performance audit, deployment and credentials handover]

Make it sound sophisticated, client-ready, and directly relevant to "${params.projectTitle}".

OUTPUT STRICT JSON WITH THIS STRUCTURE:
{
  "scope": "• Project Mission & Objectives: ...\n\n• Architecture & UI/UX Design: ...\n\n• Core Features & Deliverables: ...\n\n• Quality Assurance & Handover: ...",
  "tasks": [
    "1. Setup repository, architecture & UI design system",
    "2. Develop core client interfaces and responsive layouts",
    "3. Build server actions, database models & API endpoints",
    "4. Comprehensive testing, bugfixes & performance optimization",
    "5. Production deployment, documentation & client handover"
  ]
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      // High quality fallback if AI keys quota is reached
      const fallbackScope = `• Project Mission & Objectives: Establish a premier digital presence for ${params.projectTitle}, delivering a fast, responsive, and modern platform tailored for ${params.clientName || 'the client'}.

• Architecture & UI/UX Design: Complete system architecture setup with modern responsive design tokens, clean typography, and intuitive navigation across mobile and desktop.

• Core Features & Deliverables: Full-stack implementation of requested modules, dynamic dashboards, secure API integrations, and robust data persistence.

• Scope Boundaries & Integrations: Optimized foundational delivery focusing on high performance, analytics tracking, and streamlined communication flows.

• Quality Assurance & Handover: End-to-end cross-browser testing, performance audit, production deployment, and client handover documentation with admin credentials.`;

      const fallbackTasks = [
        "1. Setup repository, environment & UI design tokens",
        "2. Develop core interactive layouts & components",
        "3. Implement backend data models & API integrations",
        "4. Perform cross-browser testing & security checks",
        "5. Final production deployment & client handover"
      ];

      return {
        success: true,
        scope: fallbackScope,
        tasks: fallbackTasks,
        isFallback: true
      };
    }

    try {
      const data = JSON.parse(result.text);
      return {
        success: true,
        scope: data.scope || '',
        tasks: Array.isArray(data.tasks) ? data.tasks : []
      };
    } catch {
      return {
        success: true,
        scope: result.text,
        tasks: []
      };
    }
  } catch (error: any) {
    console.error('generateMarketplaceProjectScope error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

