import { 
  getTransactions, 
  getPlatformSummary, 
  getTimesheetRevenueSummary, 
  getFinanceProjectsList, 
  getExchangeRate 
} from '@/app/actions/transactionActions';
import { getProjectAnalytics } from '@/app/actions/marketplaceActions';
import FinanceClient from './FinanceClient';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  const [
    transactionsResult, 
    summaryResult, 
    analyticsResult,
    timesheetResult,
    projectsResult,
    fxResult
  ] = await Promise.all([
    getTransactions(),
    getPlatformSummary(),
    getProjectAnalytics(),
    getTimesheetRevenueSummary(),
    getFinanceProjectsList(),
    getExchangeRate(),
  ]);

  const transactions = transactionsResult.success ? transactionsResult.data : [];
  const platformSummary = summaryResult.success ? summaryResult.data : {};
  const projectAnalytics = analyticsResult.success 
    ? analyticsResult.data 
    : { Freelancer: 0, Direct: 0, Upwork: 0, Fiverr: 0 };
  const timesheetSummary = timesheetResult.success 
    ? timesheetResult.data 
    : { totalBillableSeconds: 0, totalBillableEarnings: 0, projects: [] };
  const projectsList = projectsResult.success ? projectsResult.data : [];
  const initialExchangeRate = fxResult.success ? fxResult.rate : 122;

  return (
    <FinanceClient 
      initialTransactions={transactions}
      platformSummary={platformSummary}
      projectAnalytics={projectAnalytics}
      timesheetSummary={timesheetSummary}
      projectsList={projectsList}
      initialExchangeRate={initialExchangeRate}
      authUser={authUser}
    />
  );
}
