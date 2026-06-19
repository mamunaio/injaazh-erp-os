import { getLeads } from '@/app/actions/leadActions';
import { getOutreachAnalytics } from '@/app/actions/outreachAutomationActions';
import OutreachClient from './OutreachClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OutreachPage() {
  const [leadsRes, analyticsRes] = await Promise.all([
    getLeads(),
    getOutreachAnalytics()
  ]);
  
  const initialLeads = leadsRes.success ? leadsRes.data : [];
  const initialAnalytics = analyticsRes.success ? analyticsRes.data : null;

  return <OutreachClient initialLeads={initialLeads} initialAnalytics={initialAnalytics} />;
}
