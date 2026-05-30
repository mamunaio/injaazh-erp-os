import ProjectsClient from "./ProjectsClient";
import { getProjectsBoard } from "@/app/actions/projectActions";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Project Delivery | Injaazh ERP",
  description: "Manage active projects and deliverables",
};

export default async function ProjectsPage() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role === "team_member") {
    redirect("/dashboard");
  }

  const response = await getProjectsBoard();
  const initialProjects = response.success ? response.data : [];

  return <ProjectsClient initialProjects={initialProjects} />;
}
