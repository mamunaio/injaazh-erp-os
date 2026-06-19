import PlatformClient from "./PlatformClient";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Platform Projects | Injaazh ERP",
  description: "Marketplace Platform Projects",
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlatformPage({ 
  params 
}: { 
  params: Promise<{ platform: string }> 
}) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === "team_member") {
    redirect("/dashboard");
  }

  const { platform } = await params;
  
  if (platform === 'direct' && authUser.role === 'admin') {
    redirect('/marketplace');
  }

  return <PlatformClient platform={platform} />;
}
