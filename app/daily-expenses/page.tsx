import { Metadata } from 'next';
import DailyExpensesClient from './DailyExpensesClient';
import { getDailyExpenses } from '@/app/actions/dailyExpenseActions';
import { getPersonalLoans } from '@/app/actions/loanActions';
import { getCurrentUser } from '@/app/actions/authActions';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Expenses | Injaazh ERP',
  description: 'Track daily business expenses',
};

export const dynamic = 'force-dynamic';

export default async function DailyExpensesPage() {
  const result = await getCurrentUser();
  const dbUser = result.success ? result.data : null;
  
  if (!dbUser || dbUser.role !== 'owner') {
    redirect('/dashboard');
  }

  const expenses = await getDailyExpenses();
  const loansRes = await getPersonalLoans();
  const loans = loansRes.success ? loansRes.data : [];

  return <DailyExpensesClient initialExpenses={expenses} initialLoans={loans} />;
}
