import { Metadata } from 'next';
import DailyExpensesClient from './DailyExpensesClient';
import { getDailyExpenses } from '@/app/actions/dailyExpenseActions';
import { getPersonalDebts } from '@/app/actions/personalDebtActions';
import { getCurrentUser } from '@/app/actions/authActions';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Daily Expenses | Injaazh ERP',
  description: 'Track daily personal and office expenses',
};

export const dynamic = 'force-dynamic';

export default async function DailyExpensesPage() {
  const result = await getCurrentUser();
  const dbUser = result.success ? result.data : null;
  
  if (!dbUser || dbUser.role !== 'owner') {
    redirect('/dashboard');
  }

  const [expenses, debtsResult] = await Promise.all([
    getDailyExpenses(),
    getPersonalDebts()
  ]);

  const initialDebts = debtsResult.success ? debtsResult.data : [];

  return <DailyExpensesClient initialExpenses={expenses} initialDebts={initialDebts} />;
}
