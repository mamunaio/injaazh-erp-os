'use server';

import { getCurrentUser } from './authActions';
import connectToDatabase from '@/lib/mongodb';
import TimeLog from '@/models/TimeLog';
import { Project } from '@/models/Project';
import { SystemSettings } from '@/models/SystemSettings';

export async function getTimeLogs() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized', data: [] };
    
    await connectToDatabase();
    
    const logs = await TimeLog.find({ userId: authRes.data._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();
      
    return { success: true, data: JSON.parse(JSON.stringify(logs)) };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function createTimeLog(data: {
  project: string;
  task: string;
  date: string; // ISO string or YYYY-MM-DD
  startTime: string;
  endTime: string;
  durationSeconds: number;
  hourlyRate?: number;
  billable?: boolean;
}) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const logDate = new Date(data.date);
    logDate.setHours(0, 0, 0, 0);

    const rate = typeof data.hourlyRate === 'number' && data.hourlyRate >= 0 ? data.hourlyRate : 25;
    const isBillable = data.billable !== false;
    
    const newLog = await TimeLog.create({
      userId: authRes.data._id,
      project: data.project.trim(),
      task: data.task.trim(),
      date: logDate,
      startTime: data.startTime,
      endTime: data.endTime,
      durationSeconds: data.durationSeconds,
      hourlyRate: rate,
      billable: isBillable,
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
  hourlyRate?: number;
  billable?: boolean;
}) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const logDate = new Date(data.date);
    logDate.setHours(0, 0, 0, 0);

    const rate = typeof data.hourlyRate === 'number' && data.hourlyRate >= 0 ? data.hourlyRate : 25;
    const isBillable = data.billable !== false;
    
    const updated = await TimeLog.findOneAndUpdate(
      { _id: id, userId: authRes.data._id },
      {
        project: data.project.trim(),
        task: data.task.trim(),
        date: logDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationSeconds: data.durationSeconds,
        hourlyRate: rate,
        billable: isBillable,
      },
      { new: true }
    ).lean();
    
    if (!updated) return { success: false, error: 'Log not found or unauthorized' };
    
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTimeLogRate(id: string, hourlyRate: number) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    
    await connectToDatabase();
    
    const rate = typeof hourlyRate === 'number' && hourlyRate >= 0 ? hourlyRate : 25;
    
    const updated = await TimeLog.findOneAndUpdate(
      { _id: id, userId: authRes.data._id },
      { hourlyRate: rate },
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

export async function saveUserDefaultRate(hourlyRate: number) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    const userId = authRes.data._id;

    const rate = typeof hourlyRate === 'number' && hourlyRate >= 0 ? hourlyRate : 25;

    await connectToDatabase();

    const key = `default_hourly_rate_${userId}`;
    await SystemSettings.findOneAndUpdate(
      { key },
      { key, value: rate },
      { upsert: true, new: true }
    );

    // Also update any logs for this user where hourlyRate was not explicitly set
    await TimeLog.updateMany(
      { userId, $or: [{ hourlyRate: { $exists: false } }, { hourlyRate: null }] },
      { hourlyRate: rate }
    );

    return { success: true, rate };
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

    // Fetch user's custom saved default rate (fallback 25)
    const defaultRateDoc = await SystemSettings.findOne({ key: `default_hourly_rate_${userId}` }).lean();
    const userDefaultRate = typeof defaultRateDoc?.value === 'number' && defaultRateDoc.value >= 0 
      ? defaultRateDoc.value 
      : 25;
    
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
    let billableSecondsMonth = 0;
    let billableValueMonth = 0;
    let totalRateSum = 0;
    let logsCount = 0;
    const projectSet = new Set<string>();
    
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
      const logDate = new Date(log.date);
      const logDateStr = logDate.toISOString().slice(0, 10);
      const s = log.durationSeconds || 0;
      const rate = typeof log.hourlyRate === 'number' && log.hourlyRate >= 0 ? log.hourlyRate : userDefaultRate;
      const isBillable = log.billable !== false;

      if (log.project) projectSet.add(log.project);
      
      if (logDateStr === todayStr) secondsToday += s;
      if (logDateStr >= weekStartStr) secondsWeek += s;
      if (logDateStr >= monthStartStr) {
        secondsMonth += s;
        if (isBillable) {
          billableValueMonth += (s / 3600) * rate;
          billableSecondsMonth += s;
        }
      }

      totalRateSum += rate;
      logsCount++;
      
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

    // Effective rate: if we have billable hours this month, rate = total earnings / billable hours; otherwise average rate
    const averageRate = billableSecondsMonth > 0 
      ? Number((billableValueMonth / (billableSecondsMonth / 3600)).toFixed(2))
      : (logsCount > 0 ? Number((totalRateSum / logsCount).toFixed(2)) : userDefaultRate);

    return { 
      success: true, 
      data: {
        today: secondsToday,
        week: secondsWeek,
        month: secondsMonth,
        billableValue: billableValueMonth,
        averageRate,
        uniqueProjectsCount: projectSet.size,
        chartData
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProjectRatesAndList() {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) {
      return { success: false, error: 'Unauthorized', data: { projects: [], rates: {} } };
    }
    const userId = authRes.data._id;

    await connectToDatabase();

    // 1. Fetch from Project collection
    const dbProjects = await Project.find({}).sort({ updatedAt: -1 }).lean();
    
    // 2. Fetch custom saved project rates from SystemSettings
    const settingsDoc = await SystemSettings.findOne({ key: `project_hourly_rates_${userId}` }).lean();
    const savedRates: Record<string, number> = (settingsDoc?.value as Record<string, number>) || {};

    // 3. Collect from past TimeLogs for this user
    const pastLogs = await TimeLog.find({ userId }).sort({ createdAt: -1 }).select('project hourlyRate').lean();

    const ratesMap: Record<string, number> = {};
    const projectsList: Array<{ name: string; rate: number; status?: string }> = [];
    const seenNames = new Set<string>();

    // Priority 1: DB Projects
    dbProjects.forEach((p: any) => {
      const name = p.title?.trim();
      if (!name) return;
      seenNames.add(name.toLowerCase());
      const rate = typeof savedRates[name] === 'number' 
        ? savedRates[name] 
        : (typeof p.hourlyRate === 'number' && p.hourlyRate > 0 ? p.hourlyRate : 25);
      ratesMap[name] = rate;
      projectsList.push({ name, rate, status: p.status || 'In Progress' });
    });

    // Priority 2: Custom saved rates from SystemSettings not in DB Projects
    Object.entries(savedRates).forEach(([name, rate]) => {
      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        ratesMap[name] = rate;
        projectsList.push({ name, rate, status: 'Active' });
      }
    });

    // Priority 3: Historical projects from TimeLogs
    pastLogs.forEach((l: any) => {
      const name = l.project?.trim();
      if (!name) return;
      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        const rate = typeof l.hourlyRate === 'number' && l.hourlyRate > 0 ? l.hourlyRate : 25;
        ratesMap[name] = rate;
        projectsList.push({ name, rate, status: 'Historical' });
      }
    });

    const defaultRateDoc = await SystemSettings.findOne({ key: `default_hourly_rate_${userId}` }).lean();
    const savedDefaultRate = typeof defaultRateDoc?.value === 'number' && defaultRateDoc.value >= 0 ? defaultRateDoc.value : 25;

    return {
      success: true,
      data: {
        projects: projectsList,
        rates: ratesMap,
        defaultRate: savedDefaultRate,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message, data: { projects: [], rates: {}, defaultRate: 25 } };
  }
}

export async function saveProjectHourlyRate(projectName: string, hourlyRate: number) {
  try {
    const authRes = await getCurrentUser();
    if (!authRes.success || !authRes.data) return { success: false, error: 'Unauthorized' };
    const userId = authRes.data._id;

    if (!projectName || !projectName.trim()) {
      return { success: false, error: 'Project name is required' };
    }

    const trimmedName = projectName.trim();
    const rate = typeof hourlyRate === 'number' && hourlyRate >= 0 ? hourlyRate : 25;

    await connectToDatabase();

    // 1. Update Project in DB if title matches (case-insensitive)
    await Project.updateMany(
      { title: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { hourlyRate: rate }
    );

    // 2. Update SystemSettings map
    const key = `project_hourly_rates_${userId}`;
    const existing = await SystemSettings.findOne({ key });
    const currentRates: Record<string, number> = (existing?.value as Record<string, number>) || {};
    currentRates[trimmedName] = rate;

    await SystemSettings.findOneAndUpdate(
      { key },
      { key, value: currentRates },
      { upsert: true, new: true }
    );

    return { success: true, projectName: trimmedName, rate, rates: currentRates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
