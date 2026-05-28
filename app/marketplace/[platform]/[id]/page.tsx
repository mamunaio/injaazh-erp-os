import ProjectDetailsClient from "./ProjectDetailsClient";

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
  const { platform, id } = await params;
  return <ProjectDetailsClient platform={platform} projectId={id} />;
}
