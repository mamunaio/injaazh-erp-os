import React from 'react';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RequirementBuilderClient from '../RequirementBuilderClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Project Requirement Document | Injaazh ERP',
  description: 'Author a new client scope specification and PRD',
};

export default async function CreateRequirementPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === 'team_member') {
    redirect('/dashboard');
  }

  return <RequirementBuilderClient />;
}

