import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { Project } from '@/models/Project';
import { Transaction } from '@/models/Transaction';

function getRelativeTime(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 0) return 'Just now';
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Fetch Aggregated Metrics
    const activeLeadsCount = await Lead.countDocuments({
      outreach_status: { $nin: ['Closed', 'Not Interested'] }
    });

    const activeProjectsCount = await Project.countDocuments({
      status: 'In Progress'
    });

    const incomeSumArray = await Transaction.aggregate([
      { $match: { type: 'Income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalIncome = incomeSumArray[0]?.total || 0;

    // 2. Fetch Recent Activities from Multiple Collections
    const [recentTransactions, recentLeads, recentProjects] = await Promise.all([
      Transaction.find().sort({ date: -1 }).limit(5).lean(),
      Lead.find().sort({ createdAt: -1 }).limit(5).lean(),
      Project.find().sort({ updatedAt: -1 }).limit(5).lean()
    ]);

    // 3. Format Activities for unified mobile schema
    const activitiesList: any[] = [];

    recentTransactions.forEach((tx: any) => {
      const isIncome = tx.type === 'Income';
      activitiesList.push({
        id: `tx_${tx._id}`,
        title: isIncome ? `Received: ${tx.category}` : `Expense: ${tx.category}`,
        desc: tx.description || (isIncome ? 'Reconciled Income' : 'Office/Daily expense'),
        time: getRelativeTime(tx.date),
        icon: isIncome ? 'dollar-sign' : 'credit-card',
        color: isIncome ? '#10b981' : '#f43f5e',
        amount: isIncome ? `+$${tx.amount.toLocaleString()}` : `-$${tx.amount.toLocaleString()}`,
        sortDate: new Date(tx.date)
      });
    });

    recentLeads.forEach((lead: any) => {
      activitiesList.push({
        id: `lead_${lead._id}`,
        title: `Lead: ${lead.company_name}`,
        desc: `Status is outreach '${lead.outreach_status}'`,
        time: getRelativeTime(lead.createdAt),
        icon: 'user-check',
        color: '#f59e0b',
        amount: null,
        sortDate: new Date(lead.createdAt)
      });
    });

    recentProjects.forEach((proj: any) => {
      activitiesList.push({
        id: `proj_${proj._id}`,
        title: `Project: ${proj.title}`,
        desc: `Status: ${proj.status} (${proj.progress}% progress)`,
        time: getRelativeTime(proj.updatedAt || proj.createdAt),
        icon: 'briefcase',
        color: '#3b82f6',
        amount: null,
        sortDate: new Date(proj.updatedAt || proj.createdAt)
      });
    });

    // Sort combined activities by date descending
    const sortedActivities = activitiesList
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 10);

    // Format output data
    const responseData = {
      totalLeads: activeLeadsCount,
      activeProjects: activeProjectsCount,
      totalIncome: `$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      recentActivity: sortedActivities
    };

    return NextResponse.json(
      { success: true, data: responseData },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('Mobile dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
