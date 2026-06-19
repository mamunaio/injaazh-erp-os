import { getTransactions, getPlatformSummary } from '@/app/actions/transactionActions';
import { getProjectAnalytics } from '@/app/actions/marketplaceActions';
import MoneyClient from './MoneyClient';
import PlatformProjectAnalytics from '@/components/PlatformProjectAnalytics';
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
    <div className="min-h-screen neu-base-bg p-4 md:p-8">
      {/* Project Analytics Section */}
      <div className="mb-8">
        {analyticsResult.error ? (
          <div className="neu-flat rounded-[2rem] p-6 text-red-500">
            <p className="font-semibold">Failed to load project analytics</p>
            <p className="text-sm mt-1">{analyticsResult.error}</p>
          </div>
        ) : (
          <PlatformProjectAnalytics analytics={projectAnalytics} />
        )}
      </div>

      {/* Money Management Section */}
      <MoneyClient 
        initialTransactions={transactions}
        platformSummary={platformSummary}
      />
    </div>
  );
}
