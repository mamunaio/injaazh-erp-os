import React from 'react';
import { getPublicSeoReport } from '@/app/actions/seoActions';
import SeoReportClientView from './SeoReportClientView';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicSeoReport(slug);
  if (res.success && res.data) {
    return {
      title: `${res.data.clientName} — Weekly SEO & Work Tracker Report | Injaazh Global`,
      description: `Official Weekly SEO Performance Report and Verified Website Implementations for ${res.data.clientCompany || res.data.clientName}`,
    };
  }
  return {
    title: 'Weekly SEO Performance Report | Injaazh Global',
  };
}

export default async function PublicSeoReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicSeoReport(slug);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07080B] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-[#0E0F17] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={30} />
          </div>
          <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
            SEO Report Not Found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The SEO performance report you are trying to view does not exist or the link may have expired. Please verify the URL with your Injaazh representative.
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

  // Legacy Redirect:
  // If public client URL was accessed via an old MongoDB ObjectId (24-char hex) and a human-readable slug exists,
  // redirect to the canonical slug report URL: /seo/[slug]
  if (res.data.slug && res.data.slug !== slug && /^[0-9a-fA-F]{24}$/.test(slug)) {
    redirect(`/seo/${res.data.slug}`);
  }

  return <SeoReportClientView project={res.data} />;
}
