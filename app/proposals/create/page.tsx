import React from 'react';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProposalBuilderClient from '../ProposalBuilderClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Proposal | Injaazh ERP',
  description: 'Build a new client proposal',
};

export default async function CreateProposalPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  return <ProposalBuilderClient />;
}

