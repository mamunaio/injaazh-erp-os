import ProposalsClient from "./ProposalsClient";
import { getProposals, getProposalStats } from "@/app/actions/proposalActions";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Proposals | Injaazh ERP",
  description: "Manage client proposals and estimates",
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProposalsPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === "team_member") {
    redirect("/dashboard");
  }

  // Fetch proposals and stats
  const proposalsResponse = await getProposals();
  const statsResponse = await getProposalStats();
  
  const proposals = proposalsResponse.success ? proposalsResponse.data : [];
  const stats = statsResponse.success ? statsResponse.data : { 
    activeCount: 0, 
    wonThisMonth: 0, 
    draftsCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    totalValue: 0,
    conversionRate: 0,
  };
  
  return <ProposalsClient initialProposals={proposals} initialStats={stats} />;
}
