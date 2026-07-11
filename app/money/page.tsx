import { getTransactions, getPlatformSummary } from '@/app/actions/transactionActions';
import { getProjectAnalytics } from '@/app/actions/marketplaceActions';
import MoneyClient from './MoneyClient';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MoneyPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  const [transactionsResult, summaryResult, analyticsResult] = await Promise.all([
    getTransactions(),
    getPlatformSummary(),
    getProjectAnalytics(),
  ]);

  const transactions = transactionsResult.success ? transactionsResult.data : [];
  const platformSummary = summaryResult.success ? summaryResult.data : {};
  const projectAnalytics = analyticsResult.success 
    ? analyticsResult.data 
    : { Freelancer: 0, Direct: 0, Upwork: 0, Fiverr: 0 };

  return (
    <MoneyClient 
      initialTransactions={transactions}
      platformSummary={platformSummary}
      projectAnalytics={projectAnalytics}
    />
  );
}
