import React from 'react';
import { getPublicRequirement } from '@/app/actions/requirementActions';
import RequirementClientView from './RequirementClientView';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicRequirement(slug);
  if (res.success && res.data) {
    return {
      title: `${res.data.title || 'Project Scope'} | Injaazh Global Requirements`,
      description: `Official Project Scope & Requirements Specification (${res.data.docNumber || 'PRD'}) prepared for ${res.data.clientName}`,
    };
  }
  return {
    title: 'Project Requirements Specification | Injaazh Global',
  };
}

export default async function PublicRequirementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicRequirement(slug);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-[#0E0F17] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={30} />
          </div>
          <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
            Requirements Document Not Found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The project requirements specification you are trying to view does not exist or the link may have expired. Please verify the URL with the sender.
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

  return <RequirementClientView requirement={res.data} />;
}

