import ProposalEditorClient from "./ProposalEditorClient";

export const metadata = {
  title: "Proposal Editor | Injaazh ERP",
  description: "Edit and manage client proposals",
};

export default async function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProposalEditorClient proposalId={id} />;
}
