'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';

export async function createLead(data: any) {
  try {
    await connectToDatabase();
    
    // 🔒 DUPLICATE PREVENTION LOGIC
    const duplicateChecks = [];
    const existingLeads = [];
    
    // Check 1: Company name (case-insensitive)
    if (data.company_name) {
      const companyExists = await Lead.findOne({ 
        company_name: { $regex: new RegExp(`^${data.company_name.trim()}$`, 'i') }
      }).lean();
      
      if (companyExists) {
        duplicateChecks.push(`Company "${data.company_name}" already exists`);
        existingLeads.push(companyExists);
      }
    }
    
    // Check 2: Email (if provided)
    if (data.email && data.email.trim()) {
      const emailExists = await Lead.findOne({ 
        email: data.email.trim().toLowerCase() 
      }).lean();
      
      if (emailExists) {
        duplicateChecks.push(`Email "${data.email}" is already registered`);
        if (!existingLeads.find(l => l._id.toString() === emailExists._id.toString())) {
          existingLeads.push(emailExists);
        }
      }
    }
    
    // Check 3: Phone (if provided)
    if (data.phone && data.phone.trim()) {
      const phoneExists = await Lead.findOne({ 
        phone: data.phone.trim() 
      }).lean();
      
      if (phoneExists) {
        duplicateChecks.push(`Phone "${data.phone}" is already registered`);
        if (!existingLeads.find(l => l._id.toString() === phoneExists._id.toString())) {
          existingLeads.push(phoneExists);
        }
      }
    }
    
    // If any duplicates found, return error with existing lead info
    if (duplicateChecks.length > 0) {
      return { 
        success: false, 
        error: 'Duplicate lead detected',
        details: duplicateChecks,
        isDuplicate: true,
        existingLeads: JSON.parse(JSON.stringify(existingLeads))
      };
    }
    
    // No duplicates, proceed with creation
    const newLead = new Lead(data);
    await newLead.save();
    revalidatePath('/leads');
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(newLead)),
      message: 'Lead created successfully'
    };
  } catch (error: any) {
    console.error('Error creating lead:', error);
    
    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return { 
        success: false, 
        error: `Duplicate ${field} detected`,
        details: [`This ${field} is already registered in the system`],
        isDuplicate: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Check if a lead with similar details already exists
 * Returns existing lead if found, null otherwise
 */
export async function checkDuplicateLead(data: {
  company_name?: string;
  email?: string;
  phone?: string;
}) {
  try {
    await connectToDatabase();
    
    const queries = [];
    
    // Check by company name (case-insensitive)
    if (data.company_name) {
      queries.push({ 
        company_name: { $regex: new RegExp(`^${data.company_name.trim()}$`, 'i') }
      });
    }
    
    // Check by email
    if (data.email && data.email.trim()) {
      queries.push({ 
        email: data.email.trim().toLowerCase() 
      });
    }
    
    // Check by phone
    if (data.phone && data.phone.trim()) {
      queries.push({ 
        phone: data.phone.trim() 
      });
    }
    
    if (queries.length === 0) {
      return { success: true, exists: false, lead: null };
    }
    
    // Find any matching lead
    const existingLead = await Lead.findOne({ $or: queries }).lean();
    
    if (existingLead) {
      return { 
        success: true, 
        exists: true, 
        lead: JSON.parse(JSON.stringify(existingLead))
      };
    }
    
    return { success: true, exists: false, lead: null };
  } catch (error: any) {
    console.error('Error checking duplicate lead:', error);
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

export async function sendOutreachEmail(leadId: string, subject: string, body: string) {
  try {
    await connectToDatabase();
    
    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }
    
    if (!lead.email) {
      return { success: false, error: 'Lead does not have an email address' };
    }
    const emailTo = lead.email;
    await connectToDatabase();
    
    // Load dynamic SMTP from database if available
    const SystemSettingsModule = await import('@/models/SystemSettings');
    const dbSettings = await SystemSettingsModule.SystemSettings.findOne({ key: 'smtp' }).lean();
    const smtpData = (dbSettings?.value as any) || {};

    const smtpHost = smtpData.host || process.env.SMTP_HOST;
    const smtpUser = smtpData.user || process.env.SMTP_USER;
    const smtpPass = smtpData.pass || process.env.SMTP_PASS;
    
    let emailSent = false;
    let isSimulated = false;
    
    // Check if SMTP is configured
    const hasSmtpConfig = !!(smtpHost && smtpUser && smtpPass);
    
    if (hasSmtpConfig) {
      try {
        const { sendEmail } = await import('@/lib/email');
        const emailRes = await sendEmail({
          to: emailTo,
          subject: subject,
          text: body,
          html: body.replace(/\n/g, '<br />'),
        });
        
        if (emailRes.success) {
          emailSent = true;
          console.log(`✉️ Email successfully sent via SMTP to: ${emailTo}`);
        } else {
          console.error('❌ SMTP send failed:', emailRes.error);
          return { success: false, error: `SMTP configuration is active but failed: ${emailRes.error}` };
        }
      } catch (smtpError: any) {
        console.error('❌ SMTP send failed:', smtpError);
        return { success: false, error: `SMTP configuration is active but failed: ${smtpError.message || smtpError}` };
      }
    } else {
      console.log('ℹ️ SMTP credentials missing. Switched to Simulated Sandbox outreach.');
      isSimulated = true;
    }
    
    // Fallback simulation delay to guarantee realistic UX
    if (!emailSent) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds simulated delay
      emailSent = true;
      isSimulated = true;
    }
    
    // Progress Lead outreach_status to 'Contacted'!
    const oldStatus = lead.outreach_status;
    const newStatus = oldStatus === 'New' ? 'Contacted' : oldStatus; // Only progress if it was 'New'
    
    // Create outreach log entry
    const newLog = {
      date: new Date(),
      method: 'Email' as const,
      notes: `Subject: ${subject}\n\n${body}${isSimulated ? '\n\n[SANDBOX SIMULATION: Email sent successfully]' : ''}`
    };
    
    // Apply updates directly
    lead.outreach_status = newStatus;
    lead.outreach_logs = [newLog, ...lead.outreach_logs];
    
    await lead.save();
    
    // Safe cache revalidation
    try {
      revalidatePath('/leads');
      revalidatePath('/dashboard'); // Update metrics on dashboard too!
    } catch (error) {
      // Suppress cache warning outside browser context
    }
    
    return { 
      success: true, 
      isSimulated,
      data: JSON.parse(JSON.stringify(lead)) 
    };
  } catch (error: any) {
    console.error('❌ Outreach email server action failed:', error);
    return { success: false, error: error.message || 'Outreach failed to send' };
  }
}
