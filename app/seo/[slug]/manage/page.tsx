import React from 'react';
import { getSeoProject } from '@/app/actions/seoActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SeoProjectWorkspaceClient from '../../SeoProjectWorkspaceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getSeoProject(slug);
  if (res.success && res.data) {
    return {
      title: `${res.data.clientCompany || res.data.clientName} — SEO Workspace | Injaazh ERP`,
      description: `SEO project management, task execution matrix, keyword mapping, and weekly reporting workspace for ${res.data.clientCompany || res.data.clientName}`,
    };
  }
  return {
    title: 'SEO Work Tracker Workspace | Injaazh ERP',
  };
}

export default async function SeoProjectManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect('/login?redirect=/seo');
  }

  const { slug } = await params;
  const res = await getSeoProject(slug);

  if (!res.success || !res.data) {
    redirect('/seo');
  }

  // Legacy Redirect:
  // If accessed via an old MongoDB ObjectId (24-char hex) and a canonical human-readable slug exists,
  // permanently redirect to the human-readable URL: /seo/[slug]/manage
  if (res.data.slug && res.data.slug !== slug && /^[0-9a-fA-F]{24}$/.test(slug)) {
    redirect(`/seo/${res.data.slug}/manage`);
  }

  return <SeoProjectWorkspaceClient initialProject={res.data} userRole={authUser.role} />;
}

