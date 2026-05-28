import { notFound } from 'next/navigation';
import { getProposalById } from '@/app/actions/proposalActions';
import ProposalEditorClient from './ProposalEditorClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditorPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getProposalById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ProposalEditorClient proposal={result.data} />;
}
