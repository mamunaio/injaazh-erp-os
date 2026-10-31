import React from 'react';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProposalLookupClient from './ProposalLookupClient';

export const dynamic = 'force-dynamic';

export default async function ProposalRootPage() {
  const authUser = await getAuthUser();
  if (authUser) {
    redirect('/proposals');
  }

  return <ProposalLookupClient />;
}

