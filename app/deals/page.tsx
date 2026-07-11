import { getDeals } from '@/app/actions/dealActions';
import DealsClient from './DealsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DealsPage() {
  const dealsRes = await getDeals();
  const initialDeals = dealsRes.success ? dealsRes.data : [];

  return <DealsClient initialDeals={initialDeals} />;
}
