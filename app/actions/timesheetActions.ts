'use server';

import { getCurrentUser } from './authActions';
import connectToDatabase from '@/lib/mongodb';
import TimeLog from '@/models/TimeLog';

export async function getTimeLogs() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const logs = await TimeLog.find({ userId: authRes.data._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();
      
    return { success: true, data: JSON.parse(JSON.stringify(logs)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTimeLog(data: {
  project: string;
  task: string;
  date: string; // ISO string
  startTime: string;
  endTime: string;
  durationSeconds: number;
}) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const logDate = new Date(data.date);
    logDate.setHours(0, 0, 0, 0);
    
    const newLog = await TimeLog.create({
      userId: authRes.data._id,
      project: data.project,
      task: data.task,
      date: logDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationSeconds: data.durationSeconds,
    });
    
    return { success: true, data: JSON.parse(JSON.stringify(newLog)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTimeLog(id: string, data: {
  project: string;
  task: string;
  date: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
}) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const logDate = new Date(data.date);
    logDate.setHours(0, 0, 0, 0);
    
    const updated = await TimeLog.findOneAndUpdate(
      { _id: id, userId: authRes.data._id },
      {
        project: data.project,
        task: data.task,
        date: logDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationSeconds: data.durationSeconds,
      },
      { new: true }
    ).lean();
    
    if (!updated) return { success: false, error: 'Log not found or unauthorized' };
    
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTimeLog(id: string) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const deleted = await TimeLog.findOneAndDelete({ _id: id, userId: authRes.data._id });
    if (!deleted) return { success: false, error: 'Log not found or unauthorized' };
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTimesheetKPIs() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    const userId = authRes.data._id;
    
    await connectToDatabase();
    
    const now = new Date();
    
    // Today (local date as string)
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    
    // This week: Monday as start
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // go back to Monday
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStartStr = startOfWeek.toISOString().slice(0, 10);
    
    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = startOfMonth.toISOString().slice(0, 10);
    
    const logs = await TimeLog.find({ userId }).lean();
    
    let secondsToday = 0;
    let secondsWeek = 0;
    let secondsMonth = 0;
    
    // Chart data for last 7 days
    const chartData: any[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      chartData.push({
        dateStr,
        day: dayNames[d.getDay()],
        hours: 0,
        max: 10
      });
    }

    logs.forEach((log: any) => {
      // Get log date as YYYY-MM-DD string (timezone-safe)
      const logDate = new Date(log.date);
      const logDateStr = logDate.toISOString().slice(0, 10);
      const s = log.durationSeconds || 0;
      
      if (logDateStr === todayStr) secondsToday += s;
      if (logDateStr >= weekStartStr) secondsWeek += s;
      if (logDateStr >= monthStartStr) secondsMonth += s;
      
      // Add to chart by matching date string
      const chartItem = chartData.find(c => c.dateStr === logDateStr);
      if (chartItem) {
        chartItem.hours += (s / 3600);
      }
    });

    // Format chart values to 1 decimal
    chartData.forEach(c => {
      c.hours = Math.round(c.hours * 10) / 10;
    });

    // Ensure all bars share the same max for proportional height
    const globalMax = Math.max(1, ...chartData.map(c => c.hours));
    chartData.forEach(c => c.max = globalMax);

    const billableRate = 25; // $25/hr
    const billableValue = (secondsMonth / 3600) * billableRate;

    return { 
      success: true, 
      data: {
        today: secondsToday,
        week: secondsWeek,
        month: secondsMonth,
        billableValue,
        chartData
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

