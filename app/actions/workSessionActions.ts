'use server';

import { getCurrentUser } from './authActions';
import connectToDatabase from '@/lib/mongodb';
import WorkSession from '@/models/WorkSession';

export async function pingWorkSession() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    const user = authRes.data;

    await connectToDatabase();

    const now = new Date();
    // Use the start of the day for the date field
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);

    let session = await WorkSession.findOne({ userId: user._id, date });

    if (!session) {
      // First ping of the day, create a new session
      session = await WorkSession.create({
        userId: user._id,
        date,
        startTime: now,
        lastActiveTime: now,
        totalSeconds: 0,
      });
    } else {
      // Calculate time difference since last ping
      const lastActive = new Date(session.lastActiveTime);
      const diffSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);

      // If less than 5 minutes have passed, add the diff to totalSeconds
      // If more than 5 minutes, we assume they were away, so we don't add the idle time
      if (diffSeconds > 0 && diffSeconds <= 300) {
        session.totalSeconds += diffSeconds;
      }
      
      session.lastActiveTime = now;
      await session.save();
    }

    return { 
      success: true, 
      totalSeconds: session.totalSeconds,
      data: JSON.parse(JSON.stringify(session))
    };
  } catch (error: any) {
    console.error('Work session ping error:', error);
    return { success: false, error: error.message };
  }
}

export async function getTodayWorkSession() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    const user = authRes.data;

    await connectToDatabase();

    const now = new Date();
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);

    const session = await WorkSession.findOne({ userId: user._id, date });

    return { 
      success: true, 
      totalSeconds: session ? session.totalSeconds : 0 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTeamWorkLogs(dateString?: string) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    const user = authRes.data;

    await connectToDatabase();

    // Default to today if no date provided
    const targetDate = dateString ? new Date(dateString) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all sessions for the target date and populate user details
    const sessions = await WorkSession.find({ date: targetDate })
      .populate('userId', 'name email role avatar')
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
    if (!authRes.success || !authRes.data || authRes.data.role !== 'owner') {
      return { success: false, error: 'Unauthorized. Only Owner can edit time.' };
    }
    const user = authRes.data;

    await connectToDatabase();

    const session = await WorkSession.findById(sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    session.totalSeconds = newTotalSeconds;
    await session.save();

    return { success: true, data: JSON.parse(JSON.stringify(session)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
