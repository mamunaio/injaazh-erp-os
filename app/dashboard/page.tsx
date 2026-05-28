import { getDashboardData } from '@/app/actions/dashboardActions';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const result = await getDashboardData();
  const dashboardData = result.success ? result.data : null;

  return <DashboardClient dashboardData={dashboardData} />;
}
