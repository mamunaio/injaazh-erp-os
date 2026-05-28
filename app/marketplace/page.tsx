import MarketplaceClient from "./MarketplaceClient";
import { getMarketplaceProjects } from "@/app/actions/marketplaceActions";

export const metadata = {
  title: "Marketplace Hub | Injaazh ERP",
  description: "Directory Hierarchy",
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarketplacePage() {
  const allProjects = await getMarketplaceProjects();
  
  return <MarketplaceClient allProjects={allProjects} />;
}
