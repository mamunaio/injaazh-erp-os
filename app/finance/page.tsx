import { getTransactions, getPlatformSummary } from '@/app/actions/transactionActions';
import { getProjectAnalytics } from '@/app/actions/marketplaceActions';
import FinanceClient from './FinanceClient';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function FinancePage() {
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
    <FinanceClient 
      initialTransactions={transactions}
      platformSummary={platformSummary}
      projectAnalytics={projectAnalytics}
    />
  );
}
