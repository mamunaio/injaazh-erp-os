import React from 'react';
import { getProposal } from '@/app/actions/proposalActions';
import { getAuthUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import ProposalBuilderClient from '../../ProposalBuilderClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Proposal | Injaazh ERP',
  description: 'Edit existing client proposal',
};

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const res = await getProposal(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <ProposalBuilderClient initialData={res.data} />;
}

