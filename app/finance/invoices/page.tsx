import { getInvoices } from '@/app/actions/invoiceActions';
import InvoicesClient from './InvoicesClient';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  const result = await getInvoices();
  const invoices = result.success ? result.data : [];

  return <InvoicesClient initialInvoices={invoices} />;
}
