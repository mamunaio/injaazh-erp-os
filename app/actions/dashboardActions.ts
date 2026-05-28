'use server';

import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Transaction } from '@/models/Transaction';
import MarketplaceProject from '@/models/MarketplaceProject';

export async function getDashboardData() {
  try {
    await connectToDatabase();

    // Fetch all data in parallel
    const [leads, projects, proposals, transactions, marketplaceProjects] = await Promise.all([
      Lead.find({}).lean(),
      Project.find({}).lean(),
      Proposal.find({}).lean(),
      Transaction.find({}).sort({ date: -1 }).limit(10).lean(),
      MarketplaceProject.find({}).lean(),
    ]);

    // Calculate stats
    const totalLeads = leads.length;
    const activeLeads = leads.filter((l: any) => 
      l.outreach_status !== 'Closed' && l.outreach_status !== 'Lost'
    ).length;

    // Combine regular projects and marketplace projects
    const totalProjects = projects.length + marketplaceProjects.length;
    const activeProjects = projects.filter((p: any) => 
      p.status === 'In Progress' || p.status === 'Planning'
    ).length + marketplaceProjects.filter((mp: any) => 
      mp.status === 'In Progress' || mp.status === 'Planning'
    ).length;

    const totalProposals = proposals.length;
    const pendingProposals = proposals.filter((p: any) => 
      p.status === 'Draft' || p.status === 'Sent'
    ).length;

    // Calculate income (from transactions)
    const totalIncome = transactions
      .filter((t: any) => t.type === 'Income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const thisMonthIncome = transactions
      .filter((t: any) => {
        const date = new Date(t.date);
        const now = new Date();
        return t.type === 'Income' && 
               date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Get upcoming deadlines (projects with deadline in next 7 days)
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Combine regular projects and marketplace projects for upcoming deadlines
    const regularProjectDeadlines = projects
      .filter((p: any) => {
        if (!p.deadline) return false;
        const deadline = new Date(p.deadline);
        return deadline >= now && deadline <= sevenDaysLater && p.status !== 'Completed';
      })
      .map((p: any) => ({
        _id: p._id?.toString() || '',
        title: p.title || '',
        deadline: p.deadline ? new Date(p.deadline).toISOString() : '',
        status: p.status || '',
        progress: p.progress || 0,
      }));

    const marketplaceProjectDeadlines = marketplaceProjects
      .filter((mp: any) => {
        if (!mp.deadline) return false;
        const deadline = new Date(mp.deadline);
        return deadline >= now && deadline <= sevenDaysLater && mp.status !== 'Completed';
      })
      .map((mp: any) => ({
        _id: mp._id?.toString() || '',
        title: mp.title || '',
        deadline: mp.deadline ? new Date(mp.deadline).toISOString() : '',
        status: mp.status || '',
        progress: 0, // Marketplace projects don't have progress field
      }));

    const upcomingDeadlines = [...regularProjectDeadlines, ...marketplaceProjectDeadlines]
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    // Get recent transactions
    const recentTransactions = transactions.slice(0, 5).map((t: any) => ({
      _id: t._id?.toString() || '',
      platform: t.platform || '',
      type: t.type || '',
      amount: t.amount || 0,
      date: t.date ? new Date(t.date).toISOString() : '',
      description: t.description || '',
      category: t.category || '',
    }));

    // Get recent leads
    const recentLeads = leads
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((l: any) => ({
        _id: l._id?.toString() || '',
        company_name: l.company_name || '',
        outreach_status: l.outreach_status || '',
        targetService: l.targetService || '',
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : '',
      }));

    // Project status distribution (combine regular and marketplace projects)
    const projectStatusDistribution = {
      Planning: projects.filter((p: any) => p.status === 'Planning').length + 
                marketplaceProjects.filter((mp: any) => mp.status === 'Planning').length,
      'In Progress': projects.filter((p: any) => p.status === 'In Progress').length + 
                     marketplaceProjects.filter((mp: any) => mp.status === 'In Progress').length,
      'In Review': projects.filter((p: any) => p.status === 'In Review').length + 
                   marketplaceProjects.filter((mp: any) => mp.status === 'In Review').length,
      Completed: projects.filter((p: any) => p.status === 'Completed').length + 
                 marketplaceProjects.filter((mp: any) => mp.status === 'Completed').length,
    };

    // Platform income distribution
    const platformIncome: any = {};
    transactions
      .filter((t: any) => t.type === 'Income')
      .forEach((t: any) => {
        platformIncome[t.platform] = (platformIncome[t.platform] || 0) + t.amount;
      });

    // Income trend (last 6 months)
    const incomeTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthIncome = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return t.type === 'Income' && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      incomeTrend.push({
        month: monthKey,
        income: monthIncome,
      });
    }

    return {
      success: true,
      data: {
        stats: {
          totalLeads,
          activeLeads,
          totalProjects,
          activeProjects,
          totalProposals,
          pendingProposals,
          totalIncome,
          thisMonthIncome,
        },
        upcomingDeadlines,
        recentTransactions,
        recentLeads,
        projectStatusDistribution,
        platformIncome,
        incomeTrend,
      },
    };
  } catch (error: any) {
    console.error('❌ Error fetching dashboard data:', error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}
