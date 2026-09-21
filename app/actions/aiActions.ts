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

