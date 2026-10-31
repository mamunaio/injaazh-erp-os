import React from 'react';
import { getRequirements } from '@/app/actions/requirementActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RequirementsManagerClient from './RequirementsManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Project Requirements & Scope | Injaazh ERP',
  description: 'Manage, build, and track client project scope specifications and PRD documents',
};

export default async function RequirementsPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect('/login');
  }

  const res = await getRequirements();
  const requirements = res.success && res.data ? res.data : [];

  return <RequirementsManagerClient initialRequirements={requirements} userRole={authUser.role} />;
}

