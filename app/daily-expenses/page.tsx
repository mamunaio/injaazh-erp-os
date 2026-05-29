import { Metadata } from 'next';
import DailyExpensesClient from './DailyExpensesClient';
import { getDailyExpenses } from '@/app/actions/dailyExpenseActions';

export const metadata: Metadata = {
  title: 'Daily Expenses | Injaazh ERP',
  description: 'Track daily personal and office expenses',
};

export const dynamic = 'force-dynamic';

export default async function DailyExpensesPage() {
  const expenses = await getDailyExpenses();

  return <DailyExpensesClient initialExpenses={expenses} />;
}
