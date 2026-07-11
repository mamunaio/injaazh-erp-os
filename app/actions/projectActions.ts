'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models/Project';

export async function getProjectsBoard() {
  try {
    await connectToDatabase();
    
    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    // Convert MongoDB documents to plain objects with string IDs
    const serializedProjects = projects.map((project: any) => {
      // Create a clean object with only the fields we need
      return {
        _id: project._id?.toString() || '',
        title: project.title || '',
        description: project.description || '',
        status: ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold'].includes(project.status) ? project.status : 'Planning',
        techStack: Array.isArray(project.techStack) ? project.techStack : [],
        assignees: Array.isArray(project.assignees) ? project.assignees : [],
        progress: typeof project.progress === 'number' ? project.progress : 0,
        startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
        deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
        priority: project.priority || 'Medium',
        tags: Array.isArray(project.tags) ? project.tags : [],
        budget: typeof project.budget === 'number' ? project.budget : undefined,
        clientName: project.clientName || '',
        attachments: typeof project.attachments === 'number' ? project.attachments : 0,
        comments: typeof project.comments === 'number' ? project.comments : 0,
        leadId: project.leadId?.toString() || undefined,
        proposalId: project.proposalId?.toString() || undefined,
        marketplaceProjectId: project.marketplaceProjectId?.toString() || undefined,
        createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
    
    return { 
      success: true, 
      data: serializedProjects
    };
  } catch (error: any) {
    console.error('❌ Error fetching projects:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createProject(data: any) {
  try {
    await connectToDatabase();
    const newProject = new Project(data);
    await newProject.save();
    revalidatePath('/projects');
    return { success: true, data: JSON.parse(JSON.stringify(newProject)) };
  } catch (error: any) {
    console.error('Error creating project:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProjectStatus(projectId: string, newStatus: string) {
  try {
    await connectToDatabase();
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { status: newStatus },
      { new: true }
    ).lean();
    
    revalidatePath('/projects');
    return { success: true, data: JSON.parse(JSON.stringify(updatedProject)) };
  } catch (error: any) {
    console.error('Error updating project status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProject(projectId: string, updateData: any) {
  try {
    await connectToDatabase();
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true }
    ).lean();
    
    revalidatePath('/projects');
    return { success: true, data: JSON.parse(JSON.stringify(updatedProject)) };
  } catch (error: any) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProject(projectId: string) {
  try {
    await connectToDatabase();
    await Project.findByIdAndDelete(projectId);
    revalidatePath('/projects');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
}
