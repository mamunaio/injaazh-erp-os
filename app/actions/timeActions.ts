'use server';

import connectToDatabase from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';
import User from '@/models/User';
import { getCurrentUser } from './authActions';

export async function getWorkLogsByDate(dateStr: string) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const sessions = await WorkSession.find({
      date: {
        $gte: targetDate,
        $lt: nextDate,
      },
    })
      .populate('userId', 'name email avatar role')
      .sort({ totalSeconds: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(sessions)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateWorkLog(sessionId: string, newTotalSeconds: number) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };

    // Only owners or admins can edit work logs
    if (authRes.data.role !== 'owner' && authRes.data.role !== 'admin') {
      return { success: false, error: 'Permission denied' };
    }

    await connectToDatabase();

    const updated = await WorkSession.findByIdAndUpdate(
      sessionId,
      { totalSeconds: newTotalSeconds },
      { new: true }
    ).lean();

    if (!updated) return { success: false, error: 'Session not found' };

    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
