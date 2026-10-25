import { Metadata } from 'next';
import RoadmapClient from './RoadmapClient';
import { getRoadmapProjects } from '@/app/actions/roadmapActions';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Product & Architecture Roadmap | Injaazh ERP',
  description: 'Plan milestones, quarterly sprints, SaaS architecture, and software deployments',
};

export const dynamic = 'force-dynamic';

export default async function RoadmapPage() {
  const authUser = await getAuthUser();
  if (!authUser) {
    redirect('/login');
  }

  const result = await getRoadmapProjects();
  const initialProjects = result.success && result.data ? result.data : [];

  return <RoadmapClient initialProjects={initialProjects} />;
}
