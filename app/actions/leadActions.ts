'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';

export async function createLead(data: any) {
  try {
    await connectToDatabase();
    const newLead = new Lead(data);
    await newLead.save();
    revalidatePath('/leads');
    return { success: true, data: JSON.parse(JSON.stringify(newLead)) };
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return { success: false, error: error.message };
  }
}

export async function getLeads() {
  try {
    await connectToDatabase();
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(leads)) };
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function updateLeadStatus(id: string, newStatus: string) {
  try {
    await connectToDatabase();
    
    // Get the current lead to check previous status
    const currentLead = await Lead.findById(id).lean();
    
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { outreach_status: newStatus },
      { new: true }
    ).lean();
    
    // 🔥 AUTOMATION 1: If lead status changed to "Closed" (Won), create a project
    if (newStatus === 'Closed' && updatedLead) {
      try {
        const { Project } = await import('@/models/Project');
        
        // Check if project already exists for this lead (and is not deleted)
        const existingProject = await Project.findOne({ leadId: id });
        
        if (!existingProject) {
          const newProject = new Project({
            title: `${updatedLead.company_name} - Project`,
            description: `Auto-generated from lead: ${updatedLead.company_name}`,
            status: 'Planning',
            techStack: [updatedLead.targetService || 'General'],
            assignees: [],
            progress: 0,
            priority: 'Medium',
            tags: ['From Lead'],
            clientName: updatedLead.company_name,
            leadId: id,
            attachments: 0,
            comments: 0,
          });
          
          await newProject.save();
          revalidatePath('/projects');
          console.log(`✅ Auto-created project for lead: ${updatedLead.company_name}`);
        } else {
          console.log(`ℹ️ Project already exists for lead: ${updatedLead.company_name}`);
        }
      } catch (projectError) {
        console.error('Error auto-creating project:', projectError);
        // Don't fail the lead update if project creation fails
      }
    }
    
    // 🔥 AUTOMATION 2: If lead status changed FROM "Closed" to something else, handle the project
    if (currentLead?.outreach_status === 'Closed' && newStatus !== 'Closed') {
      try {
        const { Project } = await import('@/models/Project');
        
        // Find the linked project
        const linkedProject = await Project.findOne({ leadId: id });
        
        if (linkedProject) {
          // Option 1: Delete the project if it's still in Planning and has 0% progress
          if (linkedProject.status === 'Planning' && linkedProject.progress === 0) {
            await Project.findByIdAndDelete(linkedProject._id);
            revalidatePath('/projects');
            console.log(`🗑️ Auto-deleted project (was in Planning with 0% progress): ${linkedProject.title}`);
          } 
          // Option 2: If project has progress or moved to other columns, just log a warning
          else {
            console.warn(`⚠️ Lead status changed from Closed, but project has progress (${linkedProject.progress}%) or moved to "${linkedProject.status}". Project NOT deleted: ${linkedProject.title}`);
          }
        }
      } catch (projectError) {
        console.error('Error handling project on lead status change:', projectError);
      }
    }
    
    revalidatePath('/leads');
    return { success: true, data: JSON.parse(JSON.stringify(updatedLead)) };
  } catch (error: any) {
    console.error('Error updating lead status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateLead(id: string, updateData: any) {
  try {
    await connectToDatabase();
    
    // Get the current lead to check previous status
    const currentLead = await Lead.findById(id).lean();
    
    // Clean up dates
    if (updateData.nextFollowUpDate === '') {
      updateData.$unset = { nextFollowUpDate: "" };
      delete updateData.nextFollowUpDate;
    } else if (updateData.nextFollowUpDate) {
      updateData.nextFollowUpDate = new Date(updateData.nextFollowUpDate);
    }
    
    if (updateData.outreach_logs) {
      updateData.outreach_logs = updateData.outreach_logs.map((log: any) => ({
        ...log,
        date: log.date ? new Date(log.date) : new Date()
      }));
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      updateData.$unset ? { $set: updateData, $unset: updateData.$unset } : { $set: updateData },
      { new: true }
    ).lean();
    
    // 🔥 AUTOMATION 1: If lead status changed to "Closed" (Won), create a project
    if (updateData.outreach_status === 'Closed' && updatedLead) {
      try {
        const { Project } = await import('@/models/Project');
        
        // Check if project already exists for this lead
        const existingProject = await Project.findOne({ leadId: id });
        
        if (!existingProject) {
          const newProject = new Project({
            title: `${updatedLead.company_name} - Project`,
            description: `Auto-generated from lead: ${updatedLead.company_name}`,
            status: 'Planning',
            techStack: [updatedLead.targetService || 'General'],
            assignees: [],
            progress: 0,
            priority: 'Medium',
            tags: ['From Lead'],
            clientName: updatedLead.company_name,
            leadId: id,
            attachments: 0,
            comments: 0,
          });
          
          await newProject.save();
          revalidatePath('/projects');
          console.log(`✅ Auto-created project for lead: ${updatedLead.company_name}`);
        }
      } catch (projectError) {
        console.error('Error auto-creating project:', projectError);
        // Don't fail the lead update if project creation fails
      }
    }
    
    // 🔥 AUTOMATION 2: If lead status changed FROM "Closed" to something else, handle the project
    if (currentLead?.outreach_status === 'Closed' && updateData.outreach_status && updateData.outreach_status !== 'Closed') {
      try {
        const { Project } = await import('@/models/Project');
        
        // Find the linked project
        const linkedProject = await Project.findOne({ leadId: id });
        
        if (linkedProject) {
          // Option 1: Delete the project if it's still in Planning and has 0% progress
          if (linkedProject.status === 'Planning' && linkedProject.progress === 0) {
            await Project.findByIdAndDelete(linkedProject._id);
            revalidatePath('/projects');
            console.log(`🗑️ Auto-deleted project (was in Planning with 0% progress): ${linkedProject.title}`);
          } 
          // Option 2: If project has progress or moved to other columns, just log a warning
          else {
            console.warn(`⚠️ Lead status changed from Closed, but project has progress (${linkedProject.progress}%) or moved to "${linkedProject.status}". Project NOT deleted: ${linkedProject.title}`);
          }
        }
      } catch (projectError) {
        console.error('Error handling project on lead status change:', projectError);
      }
    }
    
    revalidatePath('/leads');
    return { success: true, data: JSON.parse(JSON.stringify(updatedLead)) };
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteLead(id: string) {
  try {
    await connectToDatabase();
    await Lead.findByIdAndDelete(id);
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return { success: false, error: error.message };
  }
}
