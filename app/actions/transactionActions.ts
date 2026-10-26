'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Transaction } from '@/models/Transaction';
import TimeLog from '@/models/TimeLog';
import { Project } from '@/models/Project';
import { SystemSettings } from '@/models/SystemSettings';
import { getAuthUser, requireWriteAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notificationService';

export async function getTransactions() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    await connectToDatabase();

    const transactions = await Transaction.find({})
      .populate('projectId', 'title platform')
      .sort({ date: -1 })
      .lean();

    // Serialize for client - confidential censorship only for non-admin viewers
    const serialized = transactions.map((t: any) => {
      const isConfidential = (!authUser || authUser.role === 'team_member') && t.platform === 'Direct';

      return {
        _id: t._id?.toString() || '',
        platform: t.platform || '',
        type: t.type || '',
        amount: t.amount || 0,
        date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
        category: t.category || '',
        description: isConfidential ? 'Confidential Transaction' : (t.description || ''),
        projectId: t.projectId ? {
          _id: t.projectId._id?.toString(),
          title: isConfidential ? 'Confidential Direct Project' : t.projectId.title,
          platform: t.projectId.platform,
        } : null,
        milestoneId: t.milestoneId || null,
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error('❌ Error fetching transactions:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createTransaction(data: any) {
  try {
    await requireWriteAuth();
    await connectToDatabase();

    const transaction = new Transaction({
      platform: data.platform,
      type: data.type,
      amount: parseFloat(data.amount),
      date: data.date ? new Date(data.date) : new Date(),
      category: data.category || 'Other',
      description: data.description || '',
      projectId: data.projectId ? data.projectId : undefined,
      projectModel: data.projectModel ? data.projectModel : undefined,
    });

    await transaction.save();

    await createNotification(
      transaction.type === 'Income' ? 'payment' : 'system',
      `A new ${transaction.type.toLowerCase()} of $${transaction.amount} was recorded.`,
      '/finance'
    );

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    return { success: true, data: JSON.parse(JSON.stringify(transaction)) };
  } catch (error: any) {
    console.error('❌ Error creating transaction:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTransaction(transactionId: string, data: any) {
  try {
    await requireWriteAuth();
    await connectToDatabase();

    const updatePayload: Record<string, any> = {
      platform: data.platform,
      type: data.type,
      amount: parseFloat(data.amount),
      date: data.date ? new Date(data.date) : new Date(),
      category: data.category,
      description: data.description,
      projectId: data.projectId ? data.projectId : undefined,
    };
    if (data.projectModel) {
      updatePayload.projectModel = data.projectModel;
    }

    const updated = await Transaction.findByIdAndUpdate(
      transactionId,
      updatePayload,
      { new: true }
    ).lean();

    await createNotification('system', `Transaction for $${updated?.amount} was updated.`, '/finance');

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('❌ Error updating transaction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    const transaction = await Transaction.findById(transactionId);
    if (transaction) {
      await createNotification('system', `Transaction for $${transaction.amount} was deleted.`, '/finance');
    }
    await Transaction.findByIdAndDelete(transactionId);

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting transaction:', error);
    return { success: false, error: error.message };
  }
}

export async function getPlatformSummary() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: {} };
    }

    await connectToDatabase();

    const platforms = ['Freelancer', 'Direct', 'Upwork', 'Fiverr'];
    const summary: any = {};

    for (const platform of platforms) {
      const income = await Transaction.aggregate([
        { $match: { platform, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const expense = await Transaction.aggregate([
        { $match: { platform, type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const incomeTotal = income[0]?.total || 0;
      const expenseTotal = expense[0]?.total || 0;

      summary[platform] = {
        income: incomeTotal,
        expense: expenseTotal,
        profit: incomeTotal - expenseTotal,
      };
    }

    return { success: true, data: summary };
  } catch (error: any) {
    console.error('❌ Error getting platform summary:', error);
    return { success: false, error: error.message, data: {} };
  }
}

export async function getTimesheetRevenueSummary() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: null };
    }

    await connectToDatabase();

    // Fetch all billable time logs
    const logs = await TimeLog.find({ billable: { $ne: false } }).sort({ date: -1 }).lean();

    // Fetch existing synced transactions to detect already synced items
    const existingSyncTx = await Transaction.find({
      $or: [
        { category: 'Timesheet Billing' },
        { description: { $regex: /Timesheet Billable/i } }
      ]
    }).lean();

    const syncedSignatures = new Set(existingSyncTx.map((t: any) => t.description.toLowerCase()));

    // Aggregate by project
    const projectAgg: Record<string, {
      project: string;
      totalSeconds: number;
      totalEarnings: number;
      effectiveRate: number;
      logsCount: number;
      lastDate: string;
      isSynced: boolean;
      platform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
    }> = {};

    let totalBillableSeconds = 0;
    let totalBillableEarnings = 0;

    // Fetch project platforms for attribution
    const dbProjects = await Project.find({}).select('title platform').lean();
    const platformMap: Record<string, 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr'> = {};
    dbProjects.forEach((p: any) => {
      if (p.title) {
        platformMap[p.title.trim().toLowerCase()] = (p.platform && ['Freelancer', 'Direct', 'Upwork', 'Fiverr'].includes(p.platform))
          ? p.platform
          : 'Direct';
      }
    });

    logs.forEach((log: any) => {
      const proj = log.project?.trim() || 'General';
      const sec = log.durationSeconds || 0;
      const rate = typeof log.hourlyRate === 'number' && log.hourlyRate >= 0 ? log.hourlyRate : 25;
      const earnings = (sec / 3600) * rate;

      totalBillableSeconds += sec;
      totalBillableEarnings += earnings;

      if (!projectAgg[proj]) {
        projectAgg[proj] = {
          project: proj,
          totalSeconds: 0,
          totalEarnings: 0,
          effectiveRate: rate,
          logsCount: 0,
          lastDate: log.date ? new Date(log.date).toISOString() : new Date().toISOString(),
          isSynced: false,
          platform: platformMap[proj.toLowerCase()] || 'Direct',
        };
      }

      projectAgg[proj].totalSeconds += sec;
      projectAgg[proj].totalEarnings += earnings;
      projectAgg[proj].logsCount += 1;
      if (new Date(log.date) > new Date(projectAgg[proj].lastDate)) {
        projectAgg[proj].lastDate = new Date(log.date).toISOString();
      }
    });

    const projectBreakdown = Object.values(projectAgg).map(p => {
      const effectiveRate = p.totalSeconds > 0 ? (p.totalEarnings / (p.totalSeconds / 3600)) : 25;
      const hoursStr = (p.totalSeconds / 3600).toFixed(1);
      const isSynced = Array.from(syncedSignatures).some(sig =>
        sig.includes(p.project.toLowerCase()) && (sig.includes(`$${p.totalEarnings.toFixed(2)}`) || sig.includes(`${hoursStr}h`))
      );
      return {
        ...p,
        totalEarnings: Number(p.totalEarnings.toFixed(2)),
        effectiveRate: Number(effectiveRate.toFixed(2)),
        isSynced
      };
    });

    return {
      success: true,
      data: {
        totalBillableSeconds,
        totalBillableEarnings: Number(totalBillableEarnings.toFixed(2)),
        projects: projectBreakdown
      }
    };
  } catch (error: any) {
    console.error('❌ Error getting timesheet revenue summary:', error);
    return {
      success: false,
      error: error.message,
      data: { totalBillableSeconds: 0, totalBillableEarnings: 0, projects: [] }
    };
  }
}

export async function syncTimesheetProjectRevenue(data: {
  projectName: string;
  amount: number;
  platform?: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr';
  hours?: number;
}) {
  try {
    await requireWriteAuth();
    await connectToDatabase();

    let targetPlatform: 'Freelancer' | 'Direct' | 'Upwork' | 'Fiverr' = data.platform || 'Direct';
    const projDoc = await Project.findOne({
      title: new RegExp(`^${data.projectName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    }).lean();

    if (projDoc?.platform && ['Upwork', 'Freelancer', 'Fiverr', 'Direct'].includes(projDoc.platform)) {
      targetPlatform = projDoc.platform as any;
    }

    const hoursText = data.hours ? `${data.hours.toFixed(1)}h logged` : 'billable sprint';
    const description = `Timesheet Billable: ${data.projectName} (${hoursText} • $${data.amount.toFixed(2)})`;

    const newTx = await Transaction.create({
      platform: targetPlatform,
      type: 'Income',
      amount: data.amount,
      date: new Date(),
      category: 'Services',
      description,
      projectId: projDoc?._id ? projDoc._id : undefined,
    });

    await createNotification(
      'payment',
      `Synced Timesheet Revenue: $${data.amount} for "${data.projectName}" recorded in Finance.`,
      '/finance'
    );

    revalidatePath('/finance');
    revalidatePath('/dashboard');
    return { success: true, data: JSON.parse(JSON.stringify(newTx)) };
  } catch (error: any) {
    console.error('❌ Error syncing timesheet revenue:', error);
    return { success: false, error: error.message };
  }
}

export async function getFinanceProjectsList() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    await connectToDatabase();
    const projects = await Project.find({})
      .select('title platform budget hourlyRate clientName')
      .sort({ updatedAt: -1 })
      .lean();

    return {
      success: true,
      data: projects.map((p: any) => ({
        _id: p._id.toString(),
        title: p.title,
        platform: (p.platform && ['Freelancer', 'Direct', 'Upwork', 'Fiverr'].includes(p.platform)) ? p.platform : 'Direct',
        budget: p.budget || 0,
        hourlyRate: p.hourlyRate || 25,
        clientName: p.clientName || '',
      }))
    };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function getExchangeRate() {
  try {
    await connectToDatabase();
    const doc = await SystemSettings.findOne({ key: 'finance_exchange_rate_bdt' }).lean();
    const rate = typeof doc?.value === 'number' && doc.value > 0 ? doc.value : 122;
    return { success: true, rate };
  } catch (error: any) {
    return { success: true, rate: 122 };
  }
}

export async function saveExchangeRate(rate: number) {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    const cleanRate = typeof rate === 'number' && rate > 0 ? rate : 122;
    await SystemSettings.findOneAndUpdate(
      { key: 'finance_exchange_rate_bdt' },
      { key: 'finance_exchange_rate_bdt', value: cleanRate },
      { upsert: true, new: true }
    );
    revalidatePath('/finance');
    return { success: true, rate: cleanRate };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
