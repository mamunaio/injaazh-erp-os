'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import MarketplaceProject from '@/models/MarketplaceProject';
import { Project } from '@/models/Project';

export async function getMarketplaceProjects(platform?: string) {
  try {
    await connectToDatabase();
    
    // Fetch and sort by deadline ascending (soonest first)
    const query = platform ? { platform: platform.charAt(0).toUpperCase() + platform.slice(1) } : {};
    
    const projects = await MarketplaceProject.find(query)
      .sort({ deadline: 1, createdAt: -1 })
      .lean()
      .exec();
      
    // Serialize for Client Component
    return JSON.parse(JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to fetch marketplace projects:', error);
    throw new Error('Failed to fetch marketplace projects');
  }
}

export async function createMarketplaceProject(data: any) {
  try {
    await connectToDatabase();
    
    const newProject = await MarketplaceProject.create(data);
    
    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${data.platform?.toLowerCase()}`);
    
    return { success: true, data: JSON.parse(JSON.stringify(newProject)) };
  } catch (error: any) {
    console.error('Failed to create marketplace project:', error);
    return { success: false, error: error.message || 'Failed to create project' };
  }
}

export async function getMarketplaceProjectById(id: string) {
  try {
    await connectToDatabase();
    const project = await MarketplaceProject.findById(id).lean().exec();
    if (!project) return null;
    return JSON.parse(JSON.stringify(project));
  } catch (error) {
    console.error('Failed to fetch marketplace project details:', error);
    throw new Error('Failed to fetch marketplace project details');
  }
}

export async function updateMarketplaceProject(id: string, data: any) {
  try {
    await connectToDatabase();
    
    const updatedProject = await MarketplaceProject.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    if (!updatedProject) {
       return { success: false, error: 'Project not found' };
    }
    
    revalidatePath('/marketplace');
    revalidatePath(`/marketplace/${updatedProject.platform.toLowerCase()}`);
    revalidatePath(`/marketplace/${updatedProject.platform.toLowerCase()}/${id}`);
    
    return { success: true, data: JSON.parse(JSON.stringify(updatedProject)) };
  } catch (error: any) {
    console.error('Failed to update marketplace project:', error);
    return { success: false, error: error.message || 'Failed to update project' };
  }
}

export async function deleteMarketplaceProject(id: string) {
  try {
    await connectToDatabase();
    
    const project = await MarketplaceProject.findById(id).lean().exec();
    if (!project) return { success: false, error: 'Project not found' };

    await MarketplaceProject.findByIdAndDelete(id);
    
    revalidatePath(`/marketplace/${project.platform.toLowerCase()}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete marketplace project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}
