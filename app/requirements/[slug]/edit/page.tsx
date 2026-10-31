import React from 'react';
import { getRequirement } from '@/app/actions/requirementActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RequirementBuilderClient from '../../RequirementBuilderClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Project Requirement Document | Injaazh ERP',
  description: 'Modify project scope, functional modules, and client prerequisites',
};

export default async function EditRequirementPage({ params }: { params: Promise<{ slug: string }> }) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  const { slug } = await params;
  const res = await getRequirement(slug);

  if (!res.success || !res.data) {
    redirect('/requirements');
  }

  return <RequirementBuilderClient initialData={res.data} />;
}

