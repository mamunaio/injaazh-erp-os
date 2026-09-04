import { NextResponse } from 'next/server';
import { generateAIContent } from '@/lib/aiProvider';
import { getAuthUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Transaction } from '@/models/Transaction';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Authenticate user
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to DB and fetch live aggregated ERP metrics for real-time context
    let liveErpContext = '';
    try {
      await connectDB();
      const [leads, projects, proposals, transactions] = await Promise.all([
        Lead.find({}).lean(),
        Project.find({ status: { $in: ['In Progress', 'In Review', 'Planning'] } }).limit(5).lean(),
        Proposal.find({}).lean(),
        Transaction.find({}).sort({ date: -1 }).limit(8).lean(),
      ]);

      const leadsTotal = leads.length;
      const leadsNew = leads.filter((l: any) => l.outreach_status === 'New').length;
      const leadsActive = leads.filter((l: any) => ['Queued', 'Email Sent', 'Replied', 'Meeting Booked'].includes(l.outreach_status)).length;
      const leadsMeetings = leads.filter((l: any) => l.outreach_status === 'Meeting Booked').length;

      const totalProposals = proposals.length;
      const pendingProposalsValue = proposals
        .filter((p: any) => ['Draft', 'Sent', 'Viewed'].includes(p.status))
        .reduce((sum, p) => sum + (p.value || 0), 0);

      const incomeTransactions = transactions.filter((t: any) => t.type === 'Income' || t.type === 'income');
      const totalRecentIncome = incomeTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      liveErpContext = `
REAL-TIME INJAAZH ERP DATA SNAPSHOT:
- User: ${user.name || user.email} (${user.role})
- Total Leads in CRM: ${leadsTotal} (New: ${leadsNew}, Active Pipeline: ${leadsActive}, Meetings Booked: ${leadsMeetings})
- Active In-Flight Projects (${projects.length}): ${projects.map(p => `"${p.title}" (${p.status}, Progress: ${p.progress}%)`).join(', ') || 'None'}
- Proposals Pipeline: ${totalProposals} total created ($${pendingProposalsValue.toLocaleString()} currently pending acceptance)
- Recent Recorded Income: $${totalRecentIncome.toLocaleString()}
      `;
    } catch (dbErr) {
      console.warn('Failed to fetch live ERP context for AI:', dbErr);
    }

    // Format conversation history
    const contextStr = messages.slice(0, -1).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const lastUserMessage = messages[messages.length - 1].content;
    
    const prompt = `You are the AI Business Copilot & Strategy Advisor for Injaazh Global ERP OS.
You assist executives and team members with data inquiries, strategic insights, cold outreach email drafting, proposal scoping, and task management.

${liveErpContext}

CONVERSATION HISTORY:
${contextStr}

LATEST USER MESSAGE:
${lastUserMessage}

GUIDELINES:
- Provide actionable, structured, and insightful answers using clean Markdown (headings, bullet points, bold highlights, code/quote blocks for email templates).
- When asked to draft emails or proposals, format them professionally with clear subject lines and copyable body blocks.
- If asked about business metrics or system status, use the exact real-time snapshot figures above.
- Be proactive and concise.`;

    const result = await generateAIContent({ prompt, jsonMode: false });

    if (!result.success || !result.text) {
      return NextResponse.json({ error: result.error || 'Failed to generate response' }, { status: 500 });
    }

    return NextResponse.json({ text: result.text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
