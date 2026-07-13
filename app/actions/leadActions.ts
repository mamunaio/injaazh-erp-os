'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { getAuthUser } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';

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
    const currentUser = await getAuthUser();
    if (currentUser) {
      data.createdBy = currentUser.id;
    }
    const newLead = new Lead(data);
    await newLead.save();
    revalidatePath('/prospects');
    
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
    const currentUser = await getAuthUser();
    let query = {};
    
    // Regular users (editors/marketplace_team) only see their own leads. 
    // Owner and admin see all.
    if (currentUser && currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      query = { createdBy: currentUser.id };
    }

    const leads = await Lead.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    const parsedLeads = JSON.parse(JSON.stringify(leads)).map((lead: any) => {
      if (lead.outreach_status === 'Contacted') {
        lead.outreach_status = 'Email Sent';
      }
      return lead;
    });
    return { success: true, data: parsedLeads };
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
    
    revalidatePath('/prospects');
    return { success: true, data: JSON.parse(JSON.stringify(updatedLead)) };
  } catch (error: any) {
    console.error('Error updating lead status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateLead(id: string, updateData: any) {
  try {
    await connectToDatabase();
    const currentUser = await getAuthUser();
    
    // Get the current lead to check previous status
    const currentLead = await Lead.findById(id).lean();

    // Automatically set nextFollowUpDate to 3 days in the future if a new outreach log is added
    if (updateData.outreach_logs && Array.isArray(updateData.outreach_logs)) {
      const currentLogsCount = currentLead?.outreach_logs?.length || 0;
      if (updateData.outreach_logs.length > currentLogsCount) {
        // A new log was added (it is the first one in the list)
        const newestLog = updateData.outreach_logs[0];
        if (newestLog && ['Email', 'WhatsApp', 'Facebook', 'Phone'].includes(newestLog.method)) {
          const followUpDate = new Date();
          const randomDays = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
          followUpDate.setDate(followUpDate.getDate() + randomDays);
          updateData.nextFollowUpDate = followUpDate;
        }
      }
    }
    
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
        date: log.date ? new Date(log.date) : new Date(),
        loggedBy: log.loggedBy || (currentUser ? currentUser.id : undefined)
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
    
    revalidatePath('/prospects');
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
    revalidatePath('/prospects');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOutreachEmail(leadId: string, subject: string, body: string, senderAccountId: string = 'auto') {
  try {
    const currentUser = await getAuthUser();
    await connectToDatabase();
    const { Lead } = await import('@/models/Lead');
    const lead = await Lead.findById(leadId);
    
    if (!lead || !lead.email) {
      return { success: false, error: 'Lead or lead email not found.' };
    }

    const emailTo = lead.email;
    let emailSent = false;
    let isSimulated = false;
    let usedAccountEmail = '';

    const { EmailAccount } = await import('@/models/EmailAccount');
    const { EmailCampaignLog } = await import('@/models/EmailCampaignLog');

    let selectedAccount = null;

    // LAZY RESET: Ensure quotas are accurate before sending
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await EmailAccount.updateMany(
      { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
      { $set: { sentToday: 0, lastResetDate: new Date() } }
    );

    if (senderAccountId && senderAccountId !== 'auto') {
      // Find the explicit account requested
      selectedAccount = await EmailAccount.findOneAndUpdate(
        {
          _id: senderAccountId,
          isActive: true,
          $expr: { $lt: ['$sentToday', '$dailyLimit'] },
        },
        { $inc: { sentToday: 1 } },
        { new: true }
      );
      if (!selectedAccount) {
        return { success: false, error: 'Selected email account is inactive or has reached its daily limit.' };
      }
    } else {
      // Auto-select an available email account
      selectedAccount = await EmailAccount.findOneAndUpdate(
        {
          isActive: true,
          $expr: { $lt: ['$sentToday', '$dailyLimit'] },
        },
        { $inc: { sentToday: 1 } },
        { new: true, sort: { sentToday: -1 } } 
      );
    }

    if (selectedAccount) {
      try {
        const nodemailer = await import('nodemailer');
        
        const isSmtp = selectedAccount.accountType === 'smtp';
        const transporter = nodemailer.createTransport(isSmtp ? {
          host: selectedAccount.smtpHost,
          port: selectedAccount.smtpPort,
          secure: selectedAccount.smtpSecure,
          auth: {
            user: selectedAccount.email,
            pass: decrypt(selectedAccount.appPassword),
          },
        } : {
          service: 'gmail',
          auth: {
            user: selectedAccount.email,
            pass: decrypt(selectedAccount.appPassword),
          },
        });

        const senderName = selectedAccount.senderName || 'Injaazh Global';
        const mailOptions: any = {
          from: `"${senderName}" <${selectedAccount.email}>`,
          to: emailTo || lead.email,
          subject: subject,
          text: body,
          html: body.replace(/\n/g, '<br />'),
        };

        const info = await transporter.sendMail(mailOptions);

        // Log the campaign using the rotating account
        await EmailCampaignLog.create({
          leadId: lead._id,
          accountId: selectedAccount._id,
          messageId: info.messageId,
          type: 'Initial', // Or follow-up depending on logic, keeping 'Initial' for manual composer
          status: 'Sent',
          sentBy: currentUser ? currentUser.id : undefined,
        });

        emailSent = true;
        usedAccountEmail = selectedAccount.email;
        console.log(`✉️ Email successfully sent via ${isSmtp ? 'SMTP' : 'Gmail'} (${selectedAccount.email}) to: ${emailTo}`);
      } catch (rotationError: any) {
        console.error(`❌ Email send failed for ${selectedAccount.email}:`, rotationError);
        // Revert quota on failure
        await EmailAccount.findByIdAndUpdate(selectedAccount._id, { $inc: { sentToday: -1 } });
        if (senderAccountId && senderAccountId !== 'auto') {
          // If explicit sender failed, do not fallback to global smtp. Throw error directly.
          return { success: false, error: `Failed to send via selected account: ${rotationError.message}` };
        }
      }
    }
    
    // Fallback to Global SMTP if no rotating account is available or if it failed
    if (!emailSent) {
      // Load dynamic SMTP from database if available
      const SystemSettingsModule = await import('@/models/SystemSettings');
      const dbSettings = await SystemSettingsModule.SystemSettings.findOne({ key: 'smtp' }).lean();
      const smtpData = (dbSettings?.value as any) || {};

      const smtpHost = smtpData.host || process.env.SMTP_HOST;
      const smtpUser = smtpData.user || process.env.SMTP_USER;
      const smtpPass = smtpData.pass || process.env.SMTP_PASS;
      
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
            usedAccountEmail = smtpUser as string;
            console.log(`✉️ Email successfully sent via Fallback Global SMTP to: ${emailTo}`);
          } else {
            console.error('❌ Fallback SMTP send failed:', emailRes.error);
            return { success: false, error: `SMTP fallback failed: ${emailRes.error}` };
          }
        } catch (smtpError: any) {
          console.error('❌ Fallback SMTP send failed:', smtpError);
          return { success: false, error: `SMTP fallback failed: ${smtpError.message || smtpError}` };
        }
      } else {
        console.log('ℹ️ No active Gmail accounts and SMTP credentials missing. Switched to Simulated Sandbox outreach.');
        isSimulated = true;
      }
    }
    
    // Fallback simulation delay to guarantee realistic UX
    if (!emailSent) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds simulated delay
      emailSent = true;
      isSimulated = true;
      usedAccountEmail = 'sandbox@simulation.local';
    }
    
    // Progress Lead outreach_status to 'Email Sent'!
    const oldStatus = lead.outreach_status;
    const newStatus = (oldStatus === 'New' || oldStatus === 'Queued') ? 'Email Sent' : oldStatus; // Progress if it was 'New' or 'Queued'
    
    // Create outreach log entry
    const newLog = {
      date: new Date(),
      method: 'Email' as const,
      notes: `Subject: ${subject}\nSent Via: ${usedAccountEmail}\n\n${body}${isSimulated ? '\n\n[SANDBOX SIMULATION: Email sent successfully]' : ''}`,
      loggedBy: (currentUser ? currentUser.id : undefined) as any,
    };
    
    // Apply updates directly
    lead.outreach_status = newStatus;
    lead.outreach_logs = [newLog, ...lead.outreach_logs];
    
    // Automatically schedule a follow-up between 3 and 5 days in the future
    const followUpDate = new Date();
    const randomDays = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    followUpDate.setDate(followUpDate.getDate() + randomDays);
    lead.nextFollowUpDate = followUpDate;
    
    await lead.save();
    
    // Safe cache revalidation
    try {
      revalidatePath('/prospects');
      revalidatePath('/dashboard'); // Update metrics on dashboard too!
    } catch (error) {
      // Suppress cache warning outside browser context
    }
    
    return { 
      success: true, 
      isSimulated,
      sentVia: usedAccountEmail,
      data: JSON.parse(JSON.stringify(lead)) 
    };
  } catch (error: any) {
    console.error('❌ Outreach email server action failed:', error);
    return { success: false, error: error.message || 'Outreach failed to send' };
  }
}

export async function scheduleOutreachEmail(leadId: string, subject: string, body: string, scheduledTime: string) {
  try {
    const currentUser = await getAuthUser();
    await connectToDatabase();
    const { Lead } = await import('@/models/Lead');
    const lead = await Lead.findById(leadId);
    
    if (!lead || !lead.email) {
      return { success: false, error: 'Lead or lead email not found.' };
    }

    const requestedTime = new Date(scheduledTime);
    if (isNaN(requestedTime.getTime())) {
      return { success: false, error: 'Invalid schedule time provided.' };
    }

    if (requestedTime < new Date()) {
      return { success: false, error: 'Schedule time must be in the future.' };
    }

    const latestQueuedLead = await Lead.findOne({
      outreach_status: 'Queued',
      outreach_scheduled_for: { $gte: requestedTime }
    }).sort({ outreach_scheduled_for: -1 });

    let finalScheduledTime = new Date(requestedTime);

    if (latestQueuedLead && latestQueuedLead.outreach_scheduled_for) {
      finalScheduledTime = new Date(latestQueuedLead.outreach_scheduled_for.getTime() + 2 * 60000);
    }

    lead.email_subject_draft = subject;
    lead.email_draft = body;
    lead.outreach_status = 'Queued';
    lead.outreach_scheduled_for = finalScheduledTime;

    await lead.save();

    const { revalidatePath } = await import('next/cache');
    try {
      revalidatePath('/prospects');
    } catch (error) {}

    return { 
      success: true, 
      scheduledFor: finalScheduledTime,
      data: JSON.parse(JSON.stringify(lead)) 
    };
  } catch (error: any) {
    console.error('❌ Outreach email scheduling failed:', error);
    return { success: false, error: error.message || 'Outreach failed to schedule' };
  }
}

export async function importCSVLeads(leadsData: any[]) {
  try {
    await connectToDatabase();
    const user = await getAuthUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const data of leadsData) {
      if (!data.company_name) {
        errors++;
        continue;
      }

      // Check duplicate by company_name or email
      let isDuplicate = false;
      if (data.email) {
        const existing = await Lead.findOne({ email: data.email.trim().toLowerCase() }).lean();
        if (existing) isDuplicate = true;
      }
      if (!isDuplicate && data.company_name) {
        const existing = await Lead.findOne({ 
          company_name: { $regex: new RegExp(`^${data.company_name.trim()}$`, 'i') }
        }).lean();
        if (existing) isDuplicate = true;
      }

      if (isDuplicate) {
        duplicates++;
        continue;
      }

      // Parse date if valid
      let parsedDate = undefined;
      if (data.nextFollowUpDate && !isNaN(new Date(data.nextFollowUpDate).getTime())) {
        parsedDate = new Date(data.nextFollowUpDate);
      }

      // Sanitize outreach status
      const validStatuses = ['New', 'Email Sent', 'Replied', 'Meeting Booked', 'Closed', 'Not Interested'];
      let safeStatus = data.outreach_status || 'New';
      const statusLower = safeStatus.toLowerCase();
      
      if (statusLower.includes('email') || statusLower.includes('message') || statusLower.includes('contact')) {
        safeStatus = 'Email Sent';
      } else if (!validStatuses.includes(safeStatus)) {
        safeStatus = 'New';
      }

      const newLead = new Lead({
        company_name: data.company_name,
        address: data.address || '',
        phone: data.phone || undefined,
        website_url: data.website_url || '',
        email: data.email || undefined,
        facebook_url: data.facebook_url || '',
        linkedin_url: data.linkedin_url || '',
        traffic_count: data.traffic_count || '',
        business_profile_link: data.business_profile_link || '',
        rating: data.rating || '',
        outreach_status: safeStatus,
        nextFollowUpDate: parsedDate,
        createdBy: user.id,
      });

      try {
        await newLead.save();
        imported++;
      } catch (err: any) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          errors++;
          console.error('Error saving lead from CSV:', err);
        }
      }
    }

    revalidatePath('/prospects');
    return { success: true, imported, duplicates, errors };
  } catch (error: any) {
    console.error('Error importing CSV leads:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteLeads(leadIds: string[]) {
  try {
    await connectToDatabase();
    
    const user = await getAuthUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!leadIds || leadIds.length === 0) {
      return { success: false, error: 'No leads selected' };
    }

    const result = await Lead.deleteMany({ _id: { $in: leadIds } });
    
    revalidatePath('/prospects');
    
    return { 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} leads` 
    };
  } catch (error: any) {
    console.error('Error bulk deleting leads:', error);
    return { success: false, error: error.message || 'Failed to delete leads' };
  }
}
