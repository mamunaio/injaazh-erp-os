import React from 'react';
import { getPublicProposal } from '@/app/actions/proposalActions';
import ProposalClientView from './ProposalClientView';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getPublicProposal(id);
  if (res.success && res.data) {
    return {
      title: `${res.data.title || 'Proposal'} | ${res.data.companyName || 'Injaazh Global'}`,
      description: `Project Proposal ${res.data.proposalNumber} prepared for ${res.data.clientName}`,
    };
  }
  return {
    title: 'Project Proposal | Injaazh Global',
  };
}

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getPublicProposal(id);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-[#0E0F17] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={30} />
          </div>
          <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
            Proposal Not Found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The proposal link you are trying to access does not exist or has expired. Please verify the URL with the sender.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={14} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return <ProposalClientView initialProposal={res.data} />;
}

