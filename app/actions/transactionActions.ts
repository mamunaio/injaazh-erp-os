'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Transaction } from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';
import { createNotification } from './notificationActions';

export async function getTransactions() {
  try {
    await connectToDatabase();
    
    const transactions = await Transaction.find({})
      .populate('projectId', 'title platform')
      .sort({ date: -1 })
      .lean();
    const authUser = await getAuthUser();
    
    // Serialize for client
    const serialized = transactions.map((t: any) => {
      const isDirectAdmin = authUser && authUser.role === 'admin' && t.platform === 'Direct';
      
      return {
        _id: t._id?.toString() || '',
        platform: t.platform || '',
        type: t.type || '',
        amount: t.amount || 0,
        date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
        category: t.category || '',
        description: isDirectAdmin ? 'Confidential Transaction' : (t.description || ''),
        projectId: t.projectId ? {
          _id: t.projectId._id?.toString(),
          title: isDirectAdmin ? 'Confidential Direct Project' : t.projectId.title,
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
    await connectToDatabase();
    
    const transaction = new Transaction({
      platform: data.platform,
      type: data.type,
      amount: parseFloat(data.amount),
      date: data.date ? new Date(data.date) : new Date(),
      category: data.category || 'Other',
      description: data.description || '',
      projectId: data.projectId || null,
    });
    
    await transaction.save();
    
    await createNotification('system', `A new transaction of $${transaction.amount} was recorded.`);
    
    revalidatePath('/finance');
    return { success: true, data: JSON.parse(JSON.stringify(transaction)) };
  } catch (error: any) {
    console.error('❌ Error creating transaction:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTransaction(transactionId: string, data: any) {
  try {
    await connectToDatabase();
    
    const updated = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        platform: data.platform,
        type: data.type,
        amount: parseFloat(data.amount),
        date: data.date ? new Date(data.date) : new Date(),
        category: data.category,
        description: data.description,
        projectId: data.projectId || null,
      },
      { new: true }
    ).lean();
    
    await createNotification('system', `Transaction for $${updated?.amount} was updated.`);
    
    revalidatePath('/finance');
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('❌ Error updating transaction:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    await connectToDatabase();
    const transaction = await Transaction.findById(transactionId);
    if (transaction) {
      await createNotification('system', `Transaction for $${transaction.amount} was deleted.`);
    }
    await Transaction.findByIdAndDelete(transactionId);
    
    revalidatePath('/finance');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting transaction:', error);
    return { success: false, error: error.message };
  }
}

export async function getPlatformSummary() {
  try {
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
