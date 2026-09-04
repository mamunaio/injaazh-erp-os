'use server';

import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Transaction } from '@/models/Transaction';
import { generateAIContent } from '@/lib/aiProvider';
import { getAuthUser } from '@/lib/auth';

/**
 * 1. Generate High-Converting Cold Outreach Email for a Lead
 */
export async function generateLeadOutreachEmail(params: {
  leadId: string;
  angle?: 'Value-First' | 'Direct Problem Solving' | 'Case Study Proof' | 'Concise Follow-up';
  customNote?: string;
  saveToDraft?: boolean;
}) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const lead = await Lead.findById(params.leadId).lean();
    if (!lead) return { success: false, error: 'Lead not found' };

    const prompt = `You are a world-class B2B Sales & Cold Outreach Strategist for "Injaazh Global" (an elite enterprise agency specializing in Web Development, Next.js / SaaS Apps, Technical SEO, AEO/GEO, and UI/UX).

LEAD INFORMATION:
- Company Name: ${lead.company_name}
- Contact Person: ${lead.full_name || lead.contact_person || 'Hiring Decision Maker'}
- Title: ${lead.title || 'Founder / Executive'}
- Target Service: ${lead.targetService || 'High-end Web Development'}
- Website URL: ${lead.website_url || 'N/A'}
- City / Country: ${lead.city || ''} ${lead.country || ''}
- Context / Notes: ${lead.lead_context || 'N/A'}
- Selected Angle: ${params.angle || 'Value-First'}
${params.customNote ? `- Special Custom Instructions: ${params.customNote}` : ''}

TASK:
Write a personalized, concise, and ultra-compelling cold outreach email.
- Avoid generic corporate fluff. Sound like a knowledgeable peer.
- Mention a specific value proposition related to their ${lead.targetService || 'digital presence'}.
- End with a low-friction call to action (e.g. 10-minute quick audit or chat).

FORMAT YOUR OUTPUT EXACTLY AS JSON:
{
  "subject": "Compelling, curiosity-inducing subject line (no clickbait)",
  "body": "Complete email body including professional greeting, paragraph breaks, and signature signoff placeholder"
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to generate email' };
    }

    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      return { success: false, error: 'Invalid AI response format' };
    }

    if (params.saveToDraft) {
      await Lead.findByIdAndUpdate(params.leadId, {
        email_subject_draft: parsed.subject,
        email_draft: parsed.body,
      });
    }

    return {
      success: true,
      data: {
        subject: parsed.subject,
        body: parsed.body,
      },
    };
  } catch (error: any) {
    console.error('generateLeadOutreachEmail error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 2. Analyze & Qualify Lead Intent & Priority Score
 */
export async function analyzeLeadQualification(leadId: string) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const lead = await Lead.findById(leadId).lean();
    if (!lead) return { success: false, error: 'Lead not found' };

    const prompt = `You are an AI Lead Scoring & B2B Qualification Engine.
Analyze the following lead data and provide an objective scoring & tactical action plan:

LEAD DETAILS:
- Company: ${lead.company_name}
- Target Service: ${lead.targetService}
- Website: ${lead.website_url || 'None provided'}
- Source: ${lead.source}
- Status: ${lead.outreach_status}
- Lead Context: ${lead.lead_context || 'None provided'}
- Location: ${lead.city || ''}, ${lead.country || ''}

OUTPUT STRICT JSON:
{
  "score": 85, // Integer 1-100 based on viability and service fit
  "intentLevel": "High" | "Medium" | "Low",
  "reasoning": "1-2 sentence explanation of why this score was assigned",
  "keyPainPoints": ["Point 1", "Point 2"],
  "recommendedAction": "Immediate next strategic step to close this deal"
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to qualify lead' };
    }

    const data = JSON.parse(result.text);
    return { success: true, data };
  } catch (error: any) {
    console.error('analyzeLeadQualification error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 3. Generate Executive Proposal Summary & Scope
 */
export async function generateProposalSummary(params: {
  title: string;
  clientName: string;
  deliverables: string[];
  budget?: number | string;
}) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const prompt = `You are a Senior Solutions Architect & Proposal Strategist for Injaazh Global.
Generate an executive-grade proposal summary and scope of work for:

- Project Title: ${params.title}
- Client Name: ${params.clientName}
- Key Deliverables: ${params.deliverables.join(', ')}
${params.budget ? `- Estimated Budget: $${params.budget}` : ''}

OUTPUT STRICT JSON:
{
  "executiveSummary": "A punchy, high-impact executive overview highlighting ROI and modern engineering excellence",
  "problemStatement": "Clear definition of the client's current challenge or digital growth bottleneck",
  "solutionApproach": "How Injaazh Global executes this with modern architecture (Next.js, Tailwind, AI, Cloud)",
  "projectPhases": [
    { "phase": "Phase 1: Discovery & Architecture", "duration": "1-2 Weeks" },
    { "phase": "Phase 2: Core Engineering & UI", "duration": "2-3 Weeks" },
    { "phase": "Phase 3: QA, Deployment & Launch", "duration": "1 Week" }
  ]
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to generate proposal summary' };
    }

    const data = JSON.parse(result.text);
    return { success: true, data };
  } catch (error: any) {
    console.error('generateProposalSummary error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 4. Generate Project Sprint Task Breakdown
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
 * 5. Dynamic Realtime AI Executive Briefing for Dashboard
 */
export async function getRealtimeAiExecutiveBriefing() {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const [leads, projects, proposals, transactions] = await Promise.all([
      Lead.find({}).lean(),
      Project.find({ status: { $in: ['In Progress', 'In Review', 'Planning'] } }).lean(),
      Proposal.find({ status: { $in: ['Draft', 'Sent', 'Viewed', 'Accepted'] } }).lean(),
      Transaction.find({}).sort({ date: -1 }).limit(10).lean(),
    ]);

    const incomeTransactions = transactions.filter((t: any) => t.type === 'Income' || t.type === 'income');
    const totalIncomeMonth = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const activeLeadsCount = leads.filter((l: any) => l.outreach_status !== 'Closed' && l.outreach_status !== 'Not Interested').length;
    const pendingProposalsValue = proposals.filter((p: any) => p.status !== 'Accepted').reduce((sum, p) => sum + (p.value || 0), 0);

    const prompt = `You are the AI Executive Chief of Staff for Injaazh ERP OS.
Analyze this real-time enterprise snapshot and deliver an ultra-sharp, actionable 3-point business intelligence summary:

SNAPSHOT:
- Active In-Progress Projects: ${projects.length}
- Active Pipeline Prospects: ${activeLeadsCount}
- Pending Proposals Pipeline: $${pendingProposalsValue.toLocaleString()}
- Recent Income Recorded: $${totalIncomeMonth.toLocaleString()}

INSTRUCTIONS:
Provide a concise, motivating executive summary with exactly 2-3 sentences. Mention the financial trajectory, high-priority focus for today, and one concrete revenue-maximizing action.`;

    const result = await generateAIContent({ prompt });
    if (!result.success || !result.text) {
      return { 
        success: true, 
        text: `You have ${projects.length} active projects and ${activeLeadsCount} prospects in the pipeline worth $${pendingProposalsValue.toLocaleString()}. Focus today on following up on pending proposals to maximize monthly cash flow.` 
      };
    }

    return { success: true, text: result.text.trim() };
  } catch (error: any) {
    console.error('getRealtimeAiExecutiveBriefing error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 6. Generate AI Template Variables for Cold Outreach
 */
export async function generateAITemplateVariables(lead: any, variables: string[], templateContext?: string) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const prompt = `You are an AI personalization engine for cold outreach emails.
We have an email template with specific placeholder variables that need to be filled based on lead data.

LEAD DATA:
- Company Name: ${lead.company_name || ''}
- Contact Person: ${lead.full_name || lead.contact_person || ''}
- Service / Niche: ${lead.targetService || ''}
- Website: ${lead.website_url || ''}
- City / State / Country: ${lead.city || ''}, ${lead.state || ''}, ${lead.country || ''}
- Context / Notes: ${lead.lead_context || ''}

REQUIRED VARIABLES TO POPULATE:
${variables.map(v => `- ${v}`).join('\n')}

${templateContext ? `TEMPLATE CONTEXT:\n${templateContext}` : ''}

INSTRUCTIONS:
Return a JSON object mapping each requested variable name to its personalized value.
If a variable (e.g. competitor or city) cannot be determined, infer a reasonable natural value or use "[NEEDS REVIEW]".

OUTPUT STRICT JSON FORMAT:
{
  ${variables.map(v => `"${v}": "personalized value"`).join(',\n  ')}
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to generate variables' };
    }

    const data = JSON.parse(result.text);
    return { success: true, data };
  } catch (error: any) {
    console.error('generateAITemplateVariables error:', error);
    return { success: false, error: error.message || 'Internal error' };
  }
}

/**
 * 7. Legacy / Generic AI Email Draft Generator
 */
export async function generateAIEmailDraft(params: {
  company_name: string;
  contact_person?: string;
  targetService?: string;
  website_url?: string;
  lead_context?: string;
}) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const prompt = `You are a cold email copywriter for Injaazh Global.
Write a personalized B2B outreach email for:
- Company: ${params.company_name}
- Contact: ${params.contact_person || 'Business Owner'}
- Target Service: ${params.targetService || 'High-end Web Development'}
- Website: ${params.website_url || 'N/A'}
- Context: ${params.lead_context || 'N/A'}

OUTPUT STRICT JSON:
{
  "subject": "Compelling subject line",
  "body": "Full body of the email"
}`;

    const result = await generateAIContent({ prompt, jsonMode: true });
    if (!result.success || !result.text) {
      return { success: false, error: result.error || 'Failed to generate draft' };
    }

    const data = JSON.parse(result.text);
    return { success: true, data };
  } catch (error: any) {
    console.error('generateAIEmailDraft error:', error);
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

