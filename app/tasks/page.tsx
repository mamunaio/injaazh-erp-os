import { Metadata } from 'next';
import TasksClient from './TasksClient';
import { getTodayTasks, getAllTaskHistory } from '@/app/actions/taskActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Work Log & Task History | Injaazh ERP',
  description: 'Manage daily sprint tasks, to-dos, and inspect lifetime work history',
};

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect('/login');
  }

  const [todayRes, historyRes] = await Promise.all([
    getTodayTasks(),
    getAllTaskHistory(),
  ]);

  const initialTodayTasks = todayRes.success ? todayRes.data : [];
  const initialHistory = historyRes.success ? historyRes.data : [];
  const initialStats = historyRes.success && historyRes.stats ? historyRes.stats : {
    totalAll: 0,
    totalCompleted: 0,
    totalPending: 0,
    completedToday: 0,
    completionRate: 0,
  };

  return (
    <TasksClient 
      initialTodayTasks={initialTodayTasks} 
      initialHistory={initialHistory} 
      initialStats={initialStats} 
    />
  );
}
