import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';

export default async function DebugProjectsPage() {
  let projects: any[] = [];
  let error: string | null = null;

  try {
    await connectToDatabase();
    projects = await Project.find({}).sort({ createdAt: -1 }).lean();
    projects = JSON.parse(JSON.stringify(projects));
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div className="p-8">
      <h1 className="mb-4">Debug: Projects in Database</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <h2 className="mb-2">Total Projects: {projects.length}</h2>
        
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found in database</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project: any) => (
              <div key={project._id} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                <h3 className="">{project.title}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div><strong>Status:</strong> {project.status}</div>
                  <div><strong>Progress:</strong> {project.progress}%</div>
                  <div><strong>Client:</strong> {project.clientName || 'N/A'}</div>
                  <div><strong>Lead ID:</strong> {project.leadId || 'N/A'}</div>
                  <div><strong>Marketplace ID:</strong> {project.marketplaceProjectId || 'N/A'}</div>
                  <div><strong>Tags:</strong> {project.tags?.join(', ') || 'None'}</div>
                  <div><strong>Tech Stack:</strong> {project.techStack?.join(', ') || 'None'}</div>
                  <div><strong>Created:</strong> {new Date(project.createdAt).toLocaleString()}</div>
                </div>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                  {JSON.stringify(project, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
