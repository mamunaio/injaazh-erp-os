import { getLeads } from '@/app/actions/leadActions';
import LeadsClient from './LeadsClient';

export default async function LeadsPage() {
  const response = await getLeads();
  const initialLeads = response.success ? response.data : [];

  return <LeadsClient initialLeads={initialLeads} />;
}
