import { getInvoice } from '@/app/actions/invoiceActions';
import InvoiceBuilderClient from './InvoiceBuilderClient';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InvoiceBuilderPage({
  searchParams
}: {
  searchParams: { edit?: string }
}) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  let initialData = null;

  if (searchParams.edit) {
    const result = await getInvoice(searchParams.edit);
    if (result.success) {
      initialData = result.data;
    }
  }

  return <InvoiceBuilderClient initialData={initialData} />;
}
