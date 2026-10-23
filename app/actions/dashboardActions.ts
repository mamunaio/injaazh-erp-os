'use server';

import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Transaction } from '@/models/Transaction';
import MarketplaceProject from '@/models/MarketplaceProject';
import SeoProject from '@/models/SeoProject';
import DailyTask from '@/models/DailyTask';

export async function getDashboardData() {
  try {
    await connectToDatabase();

    // Fetch all data in parallel
    const [projects, transactions, marketplaceProjects, seoProjects, clients, userDailyTasks] = await Promise.all([
      Project.find({}).lean(),
      Transaction.find({}).sort({ date: -1 }).lean(),
      MarketplaceProject.find({}).lean(),
      SeoProject.find({}).sort({ lastAudited: -1 }).limit(3).lean(),
      connectToDatabase().then(() => require('@/models/MarketplaceClient').default.find({}).lean()),
      DailyTask.find({}).sort({ completed: 1, priority: -1, createdAt: -1 }).lean(),
    ]);

    const totalLeads = 0;
    const activeLeads = 0;
    const closedLeads = 0;
    const leadConversionRate = 0;
    const leadsUpdatedToday = 0;
    const newLeadsToday = 0;
    const outreachAddedToday = 0;

    // Combine regular projects and marketplace projects
    const totalProjects = projects.length + marketplaceProjects.length;
    const activeProjects = projects.filter((p: any) => 
      p.status === 'In Progress' || p.status === 'Planning' || p.status === 'In Review'
    ).length + marketplaceProjects.filter((mp: any) => 
      mp.status === 'In Progress' || mp.status === 'Planning' || mp.status === 'In Review'
    ).length;

    const totalMarketplaceProjects = marketplaceProjects.length;
    const totalProposals = 0;
    const pendingProposals = 0;
    const outstandingPipelineValue = 0;
    const acceptedProposalsValue = 0;

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

    const thisMonthExpenses = transactions
      .filter((t: any) => {
        const date = new Date(t.date);
        const now = new Date();
        return (t.type === 'Expense' || t.type === 'expense') && 
               date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

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

    const totalPendingTasks = pendingTasksCount;

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

    // Recent leads (empty, leads module removed)
    const recentLeads: any[] = [];

    // Recent proposals (removed - empty for backward compat)
    const recentProposals: any[] = [];

    // Recent marketplace projects
    const recentMarketplaceProjects = marketplaceProjects
      .sort((a: any, b: any) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((mp: any) => ({
        _id: mp._id?.toString() || '',
        title: mp.title || '',
        clientName: mp.clientName || 'Direct Client',
        platform: mp.platform || 'Freelancer',
        status: mp.status || 'Planning',
        budget: mp.budget || '$0',
        updatedAt: mp.updatedAt ? new Date(mp.updatedAt).toISOString() : (mp.createdAt ? new Date(mp.createdAt).toISOString() : ''),
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

    // Cash flow trend (30 Days) - Income and Expenses
    // Check if any recent transaction is dated up to 7 days in the future (e.g. Oct 26)
    const currentDate = new Date();
    let trendEndDate = new Date(currentDate);
    transactions.forEach((t: any) => {
      const tDate = new Date(t.date);
      if (tDate > trendEndDate && tDate.getTime() - currentDate.getTime() <= 7 * 24 * 60 * 60 * 1000) {
        trendEndDate = tDate;
      }
    });

    const revenueTrend30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(trendEndDate);
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayIncome = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return (t.type === 'Income' || t.type === 'income') && 
                 tDate.getDate() === date.getDate() &&
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const dayExpense = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return (t.type === 'Expense' || t.type === 'expense') && 
                 tDate.getDate() === date.getDate() &&
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      
      revenueTrend30Days.push({ 
        dateStr: dayKey, 
        Income: Math.round(dayIncome * 100) / 100,
        Expense: Math.round(dayExpense * 100) / 100,
        Net: Math.round((dayIncome - dayExpense) * 100) / 100
      });
    }

    // Cash flow trend (last 6 months)
    const revenueTrend6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthIncome = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return (t.type === 'Income' || t.type === 'income') && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const monthExpense = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return (t.type === 'Expense' || t.type === 'expense') && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      
      revenueTrend6Months.push({ 
        dateStr: monthKey, 
        Income: Math.round(monthIncome * 100) / 100,
        Expense: Math.round(monthExpense * 100) / 100,
        Net: Math.round((monthIncome - monthExpense) * 100) / 100
      });
    }

    // Cash flow trend (This Year)
    const revenueTrendYear = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(new Date().getFullYear(), i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthIncome = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return (t.type === 'Income' || t.type === 'income') && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

      const monthExpense = transactions
        .filter((t: any) => {
          const tDate = new Date(t.date);
          return (t.type === 'Expense' || t.type === 'expense') && 
                 tDate.getMonth() === date.getMonth() && 
                 tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      
      revenueTrendYear.push({ 
        dateStr: monthKey, 
        Income: Math.round(monthIncome * 100) / 100,
        Expense: Math.round(monthExpense * 100) / 100,
        Net: Math.round((monthIncome - monthExpense) * 100) / 100
      });
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

    // Map custom user daily tasks
    const formattedUserTasks = (userDailyTasks || []).map((t: any) => ({
      id: t._id?.toString() || '',
      title: t.title || '',
      description: t.description || '',
      category: t.category || 'General',
      priority: t.priority || 'Medium',
      completed: !!t.completed,
      due_date: t.dueDate ? new Date(t.dueDate).toISOString() : '',
      type: 'Todo',
    }));

    const todayTasks = [...formattedUserTasks, ...todayProjectTasks];

    // Upcoming Meetings
    const upcomingMeetings: any[] = [];

    // Recent Activity Synthesized
    const allActivity = [
      ...marketplaceProjects.slice(0, 3).map((mp: any) => ({
        id: `mp_${mp._id}`,
        title: 'Marketplace Project Active',
        description: `${mp.title} (${mp.platform || 'Marketplace'})`,
        timestamp: mp.updatedAt ? new Date(mp.updatedAt).toISOString() : (mp.createdAt ? new Date(mp.createdAt).toISOString() : new Date().toISOString()),
        type: 'project'
      })),
      ...recentTransactions.slice(0, 3).map((t: any) => ({
        id: `txn_${t._id}`,
        title: t.type === 'Income' ? 'Payment Received' : 'Expense Recorded',
        description: `${t.category} - $${t.amount}`,
        timestamp: t.date,
        type: 'transaction'
      }))
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    // Lead Funnel
    const leadFunnel = {
      New: 0,
      Active: 0,
      Closed: 0
    };

    // Sales Pipeline / Milestones Value
    const salesPipeline = {
      Pending: pendingMilestoneValue,
      Accepted: totalIncome
    };

    // AI Insights Generator
    let aiInsights = "Based on your activity, here is what you should focus on today. ";
    if (todayTasks.length > 0) aiInsights += `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today. `;
    else aiInsights += "You have no tasks due today. ";
    
    if (upcomingMeetings.length > 0) aiInsights += `Prepare for your ${upcomingMeetings.length} upcoming meeting${upcomingMeetings.length > 1 ? 's' : ''}. `;
    
    if (pendingMilestoneValue > 0) aiInsights += `You have $${pendingMilestoneValue.toLocaleString()} in pending milestones to deliver across your marketplace projects. `;
    
    if (thisMonthIncome > 0) aiInsights += `Great job generating $${thisMonthIncome.toLocaleString()} in revenue this month! Keep up the momentum.`;
    else aiInsights += `Stay proactive on your marketplace deliverables to unlock milestone payments.`;

    return {
      success: true,
      data: {
        stats: {
          totalLeads,
          activeLeads,
          totalProjects,
          activeProjects,
          totalMarketplaceProjects,
          totalProposals,
          pendingProposals,
          totalIncome,
          thisMonthIncome,
          totalExpenses,
          thisMonthExpenses,
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
        recentMarketplaceProjects,
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
