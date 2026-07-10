import { getCampaigns } from '@/app/actions/campaignActions';
import CampaignsClient from './CampaignsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignsPage() {
  const response = await getCampaigns();
  const initialCampaigns = response.success ? response.campaigns : [];

  return <CampaignsClient initialCampaigns={initialCampaigns} />;
}
