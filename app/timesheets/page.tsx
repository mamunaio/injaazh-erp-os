import { getCurrentUser } from '@/app/actions/authActions';
import { getTimeLogs, getTimesheetKPIs } from '@/app/actions/timesheetActions';
import { redirect } from 'next/navigation';
import TimesheetsClient from './TimesheetsClient';

export const metadata = {
  title: 'Timesheets | Injaazh ERP OS',
  description: 'Track, review, and manage your logged hours.',
};

export default async function TimesheetsPage() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    redirect('/login');
  }

  const logsRes = await getTimeLogs();
  const kpisRes = await getTimesheetKPIs();

  return (
    <TimesheetsClient 
      user={userRes.data} 
      initialLogs={logsRes.success ? logsRes.data : []} 
      initialKpis={kpisRes.success ? kpisRes.data : null} 
    />
  );
}
