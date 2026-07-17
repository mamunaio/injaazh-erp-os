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
        status: ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Cancelled'].includes(project.status) ? project.status : 'Planning',
        techStack: Array.isArray(project.techStack) ? project.techStack : [],
        assignees: Array.isArray(project.assignees) ? project.assignees : [],
        progress: typeof project.progress === 'number' ? project.progress : 0,
        startDate: project.startDate ? new Date(project.startDate).toISOString() : null,
        deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
        priority: project.priority || 'Medium',
        tags: Array.isArray(project.tags) ? project.tags : [],
        budget: typeof project.budget === 'number' ? project.budget : undefined,
        platformFee: typeof project.platformFee === 'number' ? project.platformFee : undefined,
        platform: project.platform || undefined,
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

import { createTransaction } from './transactionActions';

import { Transaction } from '@/models/Transaction';

async function handleProjectCompletionSync(project: any) {
  if (!project || !project.budget || project.budget <= 0) return;

  // Prevent duplicate income logs, update if amount changed
  const existingIncome = await Transaction.findOne({
    category: 'Project Revenue',
    description: new RegExp(project.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') // escape regex
  });

  // Calculate fee from project data
  let calculatedFee = project.platformFee || 0;

  const netIncome = project.budget - calculatedFee;
  
  if (netIncome > 0) {
    if (existingIncome) {
      if (existingIncome.amount !== netIncome) {
        await Transaction.findByIdAndUpdate(existingIncome._id, { amount: netIncome });
      }
    } else {
      await createTransaction({
        platform: project.platform || 'Direct',
        type: 'Income',
        amount: netIncome,
        category: 'Project Revenue',
        description: `Revenue from completed project: ${project.title}`,
        date: new Date().toISOString()
      });
    }
  }


}

import { createNotification } from './notificationActions';

export async function createProject(data: any) {
  try {
    await connectToDatabase();
    
    // Auto-calculate platform fee if applicable
    if (data.platform && data.budget) {
      if (data.platform === 'Freelancer') {
        data.platformFee = Math.max(5, data.budget * 0.10);
      } else if (data.platform === 'Upwork') {
        data.platformFee = data.budget * 0.10;
      } else if (data.platform === 'Fiverr') {
        data.platformFee = data.budget * 0.20;
      } else {
        data.platformFee = 0;
      }
    }
    
    const newProject = new Project(data);
    await newProject.save();
    
    await createNotification('system', `Project "${newProject.title}" was created.`);
    
    // Automatically log platform fee as a Finance Transaction if > 0
    if (newProject.platformFee && newProject.platformFee > 0) {
      await createTransaction({
        platform: newProject.platform || 'Direct',
        type: 'Expense',
        amount: newProject.platformFee,
        category: 'Platform Fee',
        description: `Platform Fee for Project: ${newProject.title}`,
        date: new Date().toISOString()
      });
    }

    if (newProject.status === 'Completed') {
      await handleProjectCompletionSync(newProject);
    }

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
    
    if (newStatus === 'Completed') {
      await handleProjectCompletionSync(updatedProject);
    }
    
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
    
    const oldProject = await Project.findById(projectId).lean();
    
    // Auto-calculate platform fee if applicable
    const budget = updateData.budget !== undefined ? updateData.budget : (oldProject ? oldProject.budget : 0);
    const platform = updateData.platform !== undefined ? updateData.platform : (oldProject ? oldProject.platform : null);
    
    if (platform && budget) {
      if (platform === 'Freelancer') {
        updateData.platformFee = Math.max(5, budget * 0.10);
      } else if (platform === 'Upwork') {
        updateData.platformFee = budget * 0.10;
      } else if (platform === 'Fiverr') {
        updateData.platformFee = budget * 0.20;
      } else {
        updateData.platformFee = 0;
      }
    } else {
      updateData.platformFee = 0;
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true }
    ).lean();
    
    // Log or update platform fee as a Finance Transaction
    if (updateData.platformFee !== undefined) {
      const newTitle = updateData.title || (oldProject ? oldProject.title : '');
      const oldTitle = oldProject ? oldProject.title : '';
      
      const feeDesc = `Platform Fee for Project: ${newTitle}`;
      const oldFeeDesc = `Platform Fee for Project: ${oldTitle}`;
      
      if (updateData.platformFee > 0) {
        // Find existing transaction using old title first, fallback to new title
        const existingTx = await Transaction.findOne({ 
          $or: [
            { description: oldFeeDesc, type: 'Expense' },
            { description: feeDesc, type: 'Expense' },
            { description: `Auto-calculated Platform Fee for Project: ${oldTitle}`, type: 'Expense' },
            { description: `Auto-calculated Platform Fee for Project: ${newTitle}`, type: 'Expense' }
          ]
        });
        if (existingTx) {
          existingTx.description = feeDesc;
          existingTx.amount = updateData.platformFee;
          existingTx.platform = updateData.platform || (oldProject ? oldProject.platform : 'Direct');
          await existingTx.save();
        } else {
          await createTransaction({
            platform: updateData.platform || (oldProject ? oldProject.platform : 'Direct'),
            type: 'Expense',
            amount: updateData.platformFee,
            category: 'Platform Fee',
            description: feeDesc,
            date: new Date().toISOString()
          });
        }
      } else if (updateData.platformFee === 0) {
        // If fee changed to 0, remove the existing transaction
        await Transaction.deleteMany({ 
          $or: [
            { description: oldFeeDesc, type: 'Expense' },
            { description: feeDesc, type: 'Expense' }
          ]
        });
      }
    }
    
    if (updatedProject && updatedProject.status === 'Completed') {
      await handleProjectCompletionSync(updatedProject);
    }
    
    await createNotification('system', `Project "${updatedProject?.title}" was updated.`);
    
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
    const project = await Project.findById(projectId);
    if (project) {
      await createNotification('system', `Project "${project.title}" was deleted.`);
    }
    await Project.findByIdAndDelete(projectId);
    revalidatePath('/projects');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
}
