import ProjectDetailsClient from "./ProjectDetailsClient";

export const metadata = {
  title: "Project Workspace | Injaazh ERP",
  description: "Deep-Dive Project Workspace",
};

export default async function ProjectDetailsPage({ 
  params 
}: { 
  params: Promise<{ platform: string; id: string }> 
}) {
  const { platform, id } = await params;
  return <ProjectDetailsClient platform={platform} projectId={id} />;
}
