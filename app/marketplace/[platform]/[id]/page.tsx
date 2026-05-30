import ProjectDetailsClient from "./ProjectDetailsClient";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Project Workspace | Injaazh ERP",
  description: "Deep-Dive Project Workspace",
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectDetailsPage({ 
  params 
}: { 
  params: Promise<{ platform: string; id: string }> 
}) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === "team_member") {
    redirect("/dashboard");
  }

  const { platform, id } = await params;
  return <ProjectDetailsClient platform={platform} projectId={id} />;
}
