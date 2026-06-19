import { getDashboardData } from '@/app/actions/dashboardActions';
import { getDailyIslamicQuote } from '@/app/actions/dailyInsightsActions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const result = await getDashboardData();
  const dashboardData = result.success ? result.data : null;

  let islamicQuote = null;

  if (dashboardData) {
    try {
      const quoteResult = await getDailyIslamicQuote();
      islamicQuote = quoteResult.data || null;
    } catch (error) {
      console.error('Failed to get Islamic quote:', error);
      // islamicQuote remains null, component will handle gracefully
    }
  }

  return <DashboardClient dashboardData={dashboardData} islamicQuote={islamicQuote} />;
}
