import { getDashboardData } from '@/app/actions/dashboardActions';
import { generateDailyInsights, getDailyIslamicQuote } from '@/app/actions/dailyInsightsActions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const result = await getDashboardData();
  const dashboardData = result.success ? result.data : null;

  // Fetch AI daily insights and Islamic quote
  let dailyInsights = null;
  let islamicQuote = null;

  if (dashboardData) {
    try {
      const insightsResult = await generateDailyInsights(dashboardData);
      // Always use insights (fallback is provided on error)
      dailyInsights = insightsResult.insights || null;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      // dailyInsights remains null, component will handle gracefully
    }

    try {
      const quoteResult = await getDailyIslamicQuote();
      islamicQuote = quoteResult.quote || null;
    } catch (error) {
      console.error('Failed to get Islamic quote:', error);
      // islamicQuote remains null, component will handle gracefully
    }
  }

  return <DashboardClient dashboardData={dashboardData} dailyInsights={dailyInsights} islamicQuote={islamicQuote} />;
}
