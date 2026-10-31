import React from 'react';
import { getProposals } from '@/app/actions/proposalActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProposalsManagerClient from './ProposalsManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Proposals Management | Injaazh ERP',
  description: 'Manage, build, and track client proposals',
};

export default async function ProposalsPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect('/login');
  }

  const res = await getProposals();
  const proposals = res.success && res.data ? res.data : [];

  return <ProposalsManagerClient initialProposals={proposals} userRole={authUser.role} />;
}

