import { getDashboardData } from '@/app/actions/dashboardActions';
import { getDailyIslamicQuote } from '@/app/actions/dailyInsightsActions';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const result = await getDashboardData();
  if (!result.success || !result.data) {
    redirect('/login');
  }
  const dashboardData = result.data;

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
