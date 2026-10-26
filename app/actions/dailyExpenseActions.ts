'use server';

import connectToDatabase from '@/lib/mongodb';
import { DailyExpense } from '@/models/DailyExpense';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notificationService';
import { getAuthUser, requireOwnerAuth } from '@/lib/auth';

export async function getDailyExpenses() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'owner') {
      return [];
    }

    await connectToDatabase();
    const expenses = await DailyExpense.find().sort({ date: -1 }).lean();
    return JSON.parse(JSON.stringify(expenses));
  } catch (error) {
    console.error('Error fetching daily expenses:', error);
    return [];
  }
}

export async function createDailyExpense(data: any) {
  try {
    await requireOwnerAuth();
    await connectToDatabase();

    const expense = await DailyExpense.create(data);

    // Create automated notification
    await createNotification(
      'system',
      `A new expense of $${data.amount} has been added under ${data.category}.`,
      '/daily-expenses'
    );

    try {
      revalidatePath('/daily-expenses');
      revalidatePath('/daily-expenses/archive');
    } catch {}
    return { success: true, data: JSON.parse(JSON.stringify(expense)) };
  } catch (error: any) {
    console.error('Error creating daily expense:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDailyExpense(id: string, data: any) {
  try {
    await requireOwnerAuth();
    await connectToDatabase();

    const expense = await DailyExpense.findByIdAndUpdate(id, data, { new: true });
    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    try {
      revalidatePath('/daily-expenses');
      revalidatePath('/daily-expenses/archive');
    } catch {}
    return { success: true, data: JSON.parse(JSON.stringify(expense)) };
  } catch (error: any) {
    console.error('Error updating daily expense:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDailyExpense(id: string) {
  try {
    await requireOwnerAuth();
    await connectToDatabase();

    const expense = await DailyExpense.findByIdAndDelete(id);
    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    try {
      revalidatePath('/daily-expenses');
      revalidatePath('/daily-expenses/archive');
    } catch {}
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting daily expense:', error);
    return { success: false, error: error.message };
  }
}
