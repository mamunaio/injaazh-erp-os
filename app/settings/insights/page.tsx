import { Metadata } from 'next';
import InsightsClient from './InsightsClient';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Business Insights | Injaazh ERP',
  description: 'Executive Business Intelligence Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const authUser = await getAuthUser();
  
  if (!authUser || authUser.role !== 'owner') {
    redirect('/dashboard');
  }

  // Passing dummy data could be replaced with real API calls if they existed
  return <InsightsClient />;
}
