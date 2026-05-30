import { Metadata } from 'next';
import DailyExpensesClient from './DailyExpensesClient';
import { getDailyExpenses } from '@/app/actions/dailyExpenseActions';
import { getPersonalDebts } from '@/app/actions/personalDebtActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Daily Expenses | Injaazh ERP',
  description: 'Track daily personal and office expenses',
};

export const dynamic = 'force-dynamic';

export default async function DailyExpensesPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  const [expenses, debtsResult] = await Promise.all([
    getDailyExpenses(),
    getPersonalDebts()
  ]);

  const initialDebts = debtsResult.success ? debtsResult.data : [];

  return <DailyExpensesClient initialExpenses={expenses} initialDebts={initialDebts} />;
}
