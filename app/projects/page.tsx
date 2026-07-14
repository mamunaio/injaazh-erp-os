import ProjectsClient from "./ProjectsClient";
import { getProjectsBoard } from "@/app/actions/projectActions";
import { getMarketplaceClients } from "@/actions/marketplaceClientActions";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Project Delivery | Injaazh ERP",
  description: "Manage active projects and deliverables",
};

export default async function ProjectsPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === "team_member") {
    redirect("/dashboard");
  }

  const [response, clientsResponse] = await Promise.all([
    getProjectsBoard(),
    getMarketplaceClients()
  ]);
  
  const initialProjects = response.success ? response.data : [];
  const initialClients = clientsResponse.success ? clientsResponse.data : [];

  return <ProjectsClient initialProjects={initialProjects} initialClients={initialClients} />;
}
