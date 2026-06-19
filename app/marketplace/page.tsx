import MarketplaceClient from "./MarketplaceClient";
import { getMarketplaceProjects } from "@/app/actions/marketplaceActions";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Marketplace Hub | Injaazh ERP",
  description: "Directory Hierarchy",
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarketplacePage() {
  const authUser = await getAuthUser();
  if (!authUser || !['owner', 'admin', 'marketplace_team'].includes(authUser.role)) {
    redirect("/dashboard");
  }

  const allProjects = await getMarketplaceProjects();
  
  return <MarketplaceClient allProjects={allProjects} />;
}
