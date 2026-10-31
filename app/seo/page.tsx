import React from 'react';
import { getSeoProjects } from '@/app/actions/seoActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SeoManagerClient from './SeoManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'SEO Work Trackers & Weekly Reports | Injaazh ERP',
  description: 'Manage client SEO audit trackers, keyword benchmarks, core web vitals, and weekly client reporting portals.',
};

export default async function SeoManagerPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect('/login?redirect=/seo');
  }

  const res = await getSeoProjects();
  const initialProjects = res.success && res.data ? res.data : [];

  return <SeoManagerClient initialProjects={initialProjects} userRole={authUser.role} />;
}

