'use server';

import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { Project } from '@/models/Project';
import { Proposal } from '@/models/Proposal';
import { Transaction } from '@/models/Transaction';
import MarketplaceProject from '@/models/MarketplaceProject';
import SeoProject from '@/models/SeoProject';

export async function getDashboardData() {
  try {
    await connectToDatabase();

    // Fetch all data in parallel
    const [leads, projects, proposals, transactions, marketplaceProjects, seoProjects, clients] = await Promise.all([
      Lead.find({}).lean(),
      Project.find({}).lean(),
      Proposal.find({}).lean(),
      Transaction.find({}).sort({ date: -1 }).lean(),
      MarketplaceProject.find({}).lean(),
      SeoProject.find({}).sort({ lastAudited: -1 }).limit(3).lean(),
      connectToDatabase().then(() => require('@/models/MarketplaceClient').default.find({}).lean()),
    ]);

    // Calculate lead stats
    const totalLeads = leads.length;
    const activeLeads = leads.filter((l: any) => 
      l.outreach_status !== 'Closed' && l.outreach_status !== 'Lost' && l.outreach_status !== 'Not Interested'
    ).length;
    const closedLeads = leads.filter((l: any) => l.outreach_status === 'Closed').length;
    const leadConversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

    // Calculate today's updates
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const leadsUpdatedToday = leads.filter((l: any) => {
      const updatedAt = new Date(l.updatedAt);
      return updatedAt >= startOfToday;
    }).length;

    const newLeadsToday = leads.filter((l: any) => {
      const createdAt = new Date(l.createdAt);
      return createdAt >= startOfToday;
    }).length;

    let outreachAddedToday = 0;
    leads.forEach((l: any) => {
      if (l.outreach_logs && Array.isArray(l.outreach_logs)) {
        l.outreach_logs.forEach((log: any) => {
          const logDate = new Date(log.date);
          if (logDate >= startOfToday) {
            outreachAddedToday++;
          }
        });
      }
    });

    // Combine regular projects and marketplace projects
    const totalProjects = projects.length + marketplaceProjects.length;
    const activeProjects = projects.filter((p: any) => 
      p.status === 'In Progress' || p.status === 'Planning' || p.status === 'In Review'
    ).length + marketplaceProjects.filter((mp: any) => 
      mp.status === 'In Progress' || mp.status === 'Planning' || mp.status === 'In Review'
    ).length;

    const totalProposals = proposals.length;
    const pendingProposals = proposals.filter((p: any) => 
      p.status === 'Draft' || p.status === 'Sent' || p.status === 'Viewed'
    ).length;

    // Calculate proposal pipeline values
    const outstandingPipelineValue = proposals
      .filter((p: any) => p.status === 'Draft' || p.status === 'Sent' || p.status === 'Viewed')
      .reduce((sum: number, p: any) => sum + (p.value || 0), 0);

    const acceptedProposalsValue = proposals
      .filter((p: any) => p.status === 'Accepted')
      .reduce((sum: number, p: any) => sum + (p.value || 0), 0);

    // Calculate income and expenses (from transactions)
    const totalIncome = transactions
      .filter((t: any) => t.type === 'Income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === 'Expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;

    const thisMonthIncome = transactions
      .filter((t: any) => {
        const date = new Date(t.date);
        const now = new Date();
        return t.type === 'Income' && 
               date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const lastMonthIncome = transactions
      .filter((t: any) => {
        const date = new Date(t.date);
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return t.type === 'Income' && 
               date.getMonth() === lastMonth.getMonth() && 
               date.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const monthlyGrowth = lastMonthIncome === 0 
      ? (thisMonthIncome > 0 ? 100 : 0) 
      : Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100);

    // Pending marketplace milestone value
    // Pending marketplace milestone value & pending tasks
    let pendingMilestoneValue = 0;
    let pendingTasksCount = 0;
    marketplaceProjects.forEach((mp: any) => {
      if (mp.milestones && Array.isArray(mp.milestones)) {
        mp.milestones.forEach((m: any) => {
          if (m.status === 'Pending') {
            pendingMilestoneValue += parseFloat(m.amount) || 0;
          }
        });
      }
      if (mp.tasks && Array.isArray(mp.tasks)) {
        pendingTasksCount += mp.tasks.filter((t: any) => !t.completed).length;
      }
    });

    const pendingFollowUpsCount = leads.filter((l: any) => {
      if (!l.nextFollowUpDate) return false;
      const date = new Date(l.nextFollowUpDate);
      return date.getTime() > Date.now() && l.outreach_status !== 'Closed' && l.outreach_status !== 'Not Interested';
    }).length;

    const totalPendingTasks = pendingTasksCount + pendingFollowUpsCount;

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
        progress: 0,
      }));

    const upcomingDeadlines = [...regularProjectDeadlines, ...marketplaceProjectDeadlines]
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    // Get recent transactions
    const recentTransactions = transactions.slice(0, 10).map((t: any) => ({
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

    // Get recent proposals
    const recentProposals = proposals
      .sort((a: any, b: any) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((p: any) => ({
        _id: p._id?.toString() || '',
        title: p.title || '',
        clientName: p.clientName || '',
        status: p.status || '',
        value: p.value || 0,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : (p.createdAt ? new Date(p.createdAt).toISOString() : ''),
      }));

    // Project status distribution
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

    const milestonePlatformIncome: any = {};
    marketplaceProjects.forEach((mp: any) => {
      let paidMilestonesSum = 0;
      if (mp.milestones && Array.isArray(mp.milestones)) {
        mp.milestones.forEach((m: any) => {
          if (m.status === 'Paid') {
            paidMilestonesSum += parseFloat(m.amount) || 0;
          }
        });
      }
      
      const budgetValue = mp.budget ? parseFloat(mp.budget.replace(/[^0-9.-]+/g, '')) : 0;
      const earned = paidMilestonesSum > 0 ? paidMilestonesSum : (mp.status === 'Completed' ? budgetValue : 0);
      
      if (earned > 0) {
        milestonePlatformIncome[mp.platform] = (milestonePlatformIncome[mp.platform] || 0) + earned;
      }
    });

    const marketplacePlatforms = ['Freelancer', 'Upwork', 'Fiverr', 'Direct'];
    marketplacePlatforms.forEach(platform => {
      if (milestonePlatformIncome[platform] !== undefined) {
        platformIncome[platform] = milestonePlatformIncome[platform];
      }
    });

    // Income trend (30 Days)
    const revenueTrend30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayIncome = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return t.type === 'Income' && 
                 tDate.getDate() === date.getDate() &&
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      revenueTrend30Days.push({ dateStr: dayKey, Income: dayIncome });
    }

    // Income trend (last 6 months)
    const revenueTrend6Months = [];
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
      
      revenueTrend6Months.push({ dateStr: monthKey, Income: monthIncome });
    }

    // Income trend (This Year)
    const revenueTrendYear = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(new Date().getFullYear(), i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthIncome = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return t.type === 'Income' && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      revenueTrendYear.push({ dateStr: monthKey, Income: monthIncome });
    }

    // Serialize SEO projects
    const serializedSeo = (seoProjects || []).map((p: any) => ({
      id: p._id?.toString() || '',
      clientName: p.clientName || '',
      url: p.url || '',
      lastAudited: p.lastAudited || '',
      lighthouse: {
        performance: p.lighthouse?.performance || 0,
        accessibility: p.lighthouse?.accessibility || 0,
        bestPractices: p.lighthouse?.bestPractices || 0,
        seo: p.lighthouse?.seo || 0,
      },
      aeo: {
        chatgptMentions: p.aeo?.chatgptMentions || 0,
        perplexityScore: p.aeo?.perplexityScore || 0,
      }
    }));

    // Today's Tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLeadTasks = leads
      .filter((l: any) => {
        if (!l.nextFollowUpDate) return false;
        const date = new Date(l.nextFollowUpDate);
        return date >= today && date < tomorrow;
      })
      .map((l: any) => ({
        id: `lead_${l._id}`,
        title: `Follow up with ${l.company_name}`,
        due_date: l.nextFollowUpDate,
        status: l.outreach_status,
        type: 'Lead'
      }));

    const todayProjectTasks: any[] = [];
    projects.forEach((p: any) => {
      if (p.deadline) {
        const dDate = new Date(p.deadline);
        if (dDate >= today && dDate < tomorrow && p.status !== 'Completed') {
          todayProjectTasks.push({
            id: `proj_${p._id}`,
            title: `Deadline: ${p.title}`,
            due_date: p.deadline,
            status: p.status,
            type: 'Project'
          });
        }
      }
    });

    marketplaceProjects.forEach((mp: any) => {
      if (mp.tasks && Array.isArray(mp.tasks)) {
        mp.tasks.forEach((t: any) => {
          if (!t.completed && t.dueDate) {
             const tDate = new Date(t.dueDate);
             if (tDate >= today && tDate < tomorrow) {
                todayProjectTasks.push({
                  id: `mptask_${t._id}`,
                  title: t.title,
                  due_date: t.dueDate,
                  status: 'Pending',
                  type: 'Task'
                });
             }
          }
        });
      }
    });

    const todayTasks = [...todayLeadTasks, ...todayProjectTasks];

    // Upcoming Meetings
    const upcomingMeetings = leads
      .filter((l: any) => {
        if (l.outreach_status !== 'Meeting Booked' || !l.nextFollowUpDate) return false;
        const date = new Date(l.nextFollowUpDate);
        return date >= today;
      })
      .map((l: any) => ({
        id: l._id?.toString(),
        title: `Meeting with ${l.company_name}`,
        date: l.nextFollowUpDate,
        attendees: [l.contact_person || l.company_name]
      })).slice(0, 5);

    // Recent Activity Synthesized
    const allActivity = [
      ...recentLeads.map((l: any) => ({
        id: `lead_${l._id}`,
        title: 'New Lead Added',
        description: `${l.company_name} was added to leads`,
        timestamp: l.createdAt,
        type: 'lead'
      })),
      ...recentProposals.map((p: any) => ({
        id: `prop_${p._id}`,
        title: 'Proposal Updated',
        description: `Proposal for ${p.clientName} is now ${p.status}`,
        timestamp: p.updatedAt,
        type: 'proposal'
      })),
      ...recentTransactions.slice(0, 3).map((t: any) => ({
        id: `txn_${t._id}`,
        title: t.type === 'Income' ? 'Payment Received' : 'Expense Recorded',
        description: `${t.category} - $${t.amount}`,
        timestamp: t.date,
        type: 'transaction'
      }))
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    // Accurate Lead Funnel
    const leadFunnel = {
      New: leads.filter((l: any) => l.outreach_status === 'New').length,
      Active: leads.filter((l: any) => ['Queued', 'Email Sent', 'Replied', 'Meeting Booked'].includes(l.outreach_status)).length,
      Closed: leads.filter((l: any) => l.outreach_status === 'Closed').length
    };

    // Sales Pipeline Accurate
    const salesPipeline = {
      Pending: proposals.filter((p: any) => ['Draft', 'Sent', 'Viewed'].includes(p.status)).reduce((sum: number, p: any) => sum + (p.value || 0), 0),
      Accepted: proposals.filter((p: any) => p.status === 'Accepted').reduce((sum: number, p: any) => sum + (p.value || 0), 0)
    };

    // AI Insights Generator
    let aiInsights = "Based on your activity, here is what you should focus on today. ";
    if (todayTasks.length > 0) aiInsights += `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today. `;
    else aiInsights += "You have no tasks due today. ";
    
    if (upcomingMeetings.length > 0) aiInsights += `Prepare for your ${upcomingMeetings.length} upcoming meeting${upcomingMeetings.length > 1 ? 's' : ''}. `;
    
    if (pendingProposals > 0) aiInsights += `You have ${pendingProposals} pending proposal${pendingProposals > 1 ? 's' : ''} worth $${salesPipeline.Pending.toLocaleString()}; try to follow up and close them! `;
    
    if (thisMonthIncome > 0) aiInsights += `Great job generating $${thisMonthIncome.toLocaleString()} in revenue this month! Keep up the momentum.`;
    else aiInsights += `Revenue is slow this month. Focus on converting active leads and following up on pending proposals.`;

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
          totalExpenses,
          netProfit,
          outstandingPipelineValue: salesPipeline.Pending,
          acceptedProposalsValue: salesPipeline.Accepted,
          leadConversionRate,
          pendingMilestoneValue,
          leadsUpdatedToday,
          newLeadsToday,
          outreachAddedToday,
          activeClients: clients ? clients.length : 0,
          pendingTasks: totalPendingTasks,
          monthlyGrowth,
        },
        upcomingDeadlines,
        recentTransactions,
        recentLeads,
        recentProposals,
        projectStatusDistribution,
        platformIncome,
        revenueTrend30Days,
        revenueTrend6Months,
        revenueTrendYear,
        leadFunnel,
        salesPipeline,
        aiInsights,
        seoProjects: serializedSeo,
        todayTasks,
        upcomingMeetings,
        recentActivity: allActivity,
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
