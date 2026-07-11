import { getLeads } from '@/app/actions/leadActions';
import { getCampaigns } from '@/app/actions/campaignActions';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage() {
  const [leadsRes, campaignsRes] = await Promise.all([
    getLeads(),
    getCampaigns()
  ]);
  
  const initialLeads = leadsRes.success ? leadsRes.data : [];
  const initialCampaigns = campaignsRes.success ? campaignsRes.campaigns : [];

  return <LeadsClient initialLeads={initialLeads} initialCampaigns={initialCampaigns} />;
}
