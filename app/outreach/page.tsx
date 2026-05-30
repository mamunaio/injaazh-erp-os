import { getLeads } from '@/app/actions/leadActions';
import OutreachClient from './OutreachClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OutreachPage() {
  const response = await getLeads();
  const initialLeads = response.success ? response.data : [];

  return <OutreachClient initialLeads={initialLeads} />;
}
