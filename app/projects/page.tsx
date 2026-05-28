import ProjectsClient from "./ProjectsClient";
import { getProjectsBoard } from "@/app/actions/projectActions";

export const metadata = {
  title: "Project Delivery | Injaazh ERP",
  description: "Manage active projects and deliverables",
};

export default async function ProjectsPage() {
  const response = await getProjectsBoard();
  const initialProjects = response.success ? response.data : [];

  return <ProjectsClient initialProjects={initialProjects} />;
}
