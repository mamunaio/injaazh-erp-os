import { getTransactions, getPlatformSummary } from '@/app/actions/transactionActions';
import { getProjectAnalytics } from '@/app/actions/marketplaceActions';
import MoneyClient from './MoneyClient';
import PlatformProjectAnalytics from '@/components/PlatformProjectAnalytics';

export default async function MoneyPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 p-4 md:p-8">
      {/* Project Analytics Section */}
      <div className="mb-8">
        {analyticsResult.error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-500/20 rounded-2xl p-6 text-red-700 dark:text-red-400">
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
