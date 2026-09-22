'use server';

import connectToDatabase from '@/lib/mongodb';
import DailyTask from '@/models/DailyTask';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

/**
 * Get Today's Focus tasks (both active and completed today)
 */
export async function getTodayTasks() {
  try {
    await connectToDatabase();
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized', data: [] };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch tasks that are either:
    // 1) Not completed yet, OR
    // 2) Completed today
    const tasks = await DailyTask.find({
      userId: new mongoose.Types.ObjectId(user.id),
      $or: [
        { completed: false },
        { completed: true, completedAt: { $gte: todayStart, $lte: todayEnd } },
      ],
    })
      .sort({ completed: 1, priority: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(tasks)),
    };
  } catch (error: any) {
    console.error('getTodayTasks error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Create a new Daily Task / To-Do item
 */
export async function createDailyTask(params: {
  title: string;
  description?: string;
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  dueDate?: string;
}) {
  try {
    await connectToDatabase();
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    if (!params.title || !params.title.trim()) {
      return { success: false, error: 'Task title is required' };
    }

    const task = await DailyTask.create({
      userId: new mongoose.Types.ObjectId(user.id),
      title: params.title.trim(),
      description: params.description?.trim() || '',
      category: params.category || 'General',
      priority: params.priority || 'Medium',
      completed: false,
      dueDate: params.dueDate ? new Date(params.dueDate) : new Date(),
    });

    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(task)),
    };
  } catch (error: any) {
    console.error('createDailyTask error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskComplete(taskId: string, completed: boolean) {
  try {
    await connectToDatabase();
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const updateData: any = {
      completed,
      completedAt: completed ? new Date() : null,
    };

    const task = await DailyTask.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(taskId),
        userId: new mongoose.Types.ObjectId(user.id),
      },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(task)),
    };
  } catch (error: any) {
    console.error('toggleTaskComplete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a task
 */
export async function deleteDailyTask(taskId: string) {
  try {
    await connectToDatabase();
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    await DailyTask.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(user.id),
    });

    revalidatePath('/dashboard');
    revalidatePath('/tasks');

    return { success: true };
  } catch (error: any) {
    console.error('deleteDailyTask error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Lifetime Task History (Filtered, Searchable, Grouped by Date)
 */
export async function getAllTaskHistory(params?: {
  search?: string;
  category?: string;
  status?: 'all' | 'completed' | 'pending';
  limit?: number;
}) {
  try {
    await connectToDatabase();
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized', data: [], stats: null };

    const filter: any = {
      userId: new mongoose.Types.ObjectId(user.id),
    };

    if (params?.status === 'completed') {
      filter.completed = true;
    } else if (params?.status === 'pending') {
      filter.completed = false;
    }

    if (params?.category && params.category !== 'All') {
      filter.category = params.category;
    }

    if (params?.search && params.search.trim()) {
      filter.$or = [
        { title: { $regex: params.search.trim(), $options: 'i' } },
        { description: { $regex: params.search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await DailyTask.find(filter)
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(params?.limit || 200)
      .lean();

    // Calculate summary statistics
    const totalAll = await DailyTask.countDocuments({ userId: new mongoose.Types.ObjectId(user.id) });
    const totalCompleted = await DailyTask.countDocuments({ userId: new mongoose.Types.ObjectId(user.id), completed: true });
    const totalPending = await DailyTask.countDocuments({ userId: new mongoose.Types.ObjectId(user.id), completed: false });

    // Completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedToday = await DailyTask.countDocuments({
      userId: new mongoose.Types.ObjectId(user.id),
      completed: true,
      completedAt: { $gte: todayStart },
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(tasks)),
      stats: {
        totalAll,
        totalCompleted,
        totalPending,
        completedToday,
        completionRate: totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0,
      },
    };
  } catch (error: any) {
    console.error('getAllTaskHistory error:', error);
    return { success: false, error: error.message, data: [], stats: null };
  }
}
