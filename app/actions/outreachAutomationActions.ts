'use server';

import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Lead } from '@/models/Lead';
import { Campaign } from '@/models/Campaign';
import { CampaignLead } from '@/models/CampaignLead';
import { EmailAccount } from '@/models/EmailAccount';
import { EmailCampaignLog } from '@/models/EmailCampaignLog';
import nodemailer from 'nodemailer';
import { generateAIContent } from '@/lib/aiProvider';
import { decrypt } from '@/lib/encryption';
import { checkAllInboxes } from '@/app/services/imapListener';

/**
 * Automatically select an available email account that hasn't reached its daily limit.
 */
async function getAvailableEmailAccount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // LAZY RESET: Reset sentToday for accounts that weren't reset today
  await EmailAccount.updateMany(
    { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
    { $set: { sentToday: 0, lastResetDate: new Date() } }
  );

  // Find active accounts where sentToday < dailyLimit
  const account = await EmailAccount.findOneAndUpdate(
    {
      isActive: true,
      $expr: { $lt: ['$sentToday', '$dailyLimit'] },
    },
    { $inc: { sentToday: 1 } },
    { new: true, sort: { sentToday: -1 } } // Pick the account currently in use until it hits the limit
  );

  return account;
}

/**
 * Generate a highly personalized email draft using Gemini AI
 */
async function generatePersonalizedEmail(lead: any, isFollowUp = false) {
  const baseContext = lead.lead_context ? `CRITICAL LEAD CONTEXT & NOTES: ${lead.lead_context}\n\n` : '';
  
  const prompt = `You are a highly skilled Sales Executive at Injaazh Global. Your goal is to write a highly personalized, genuine, and concise outreach email (maximum 120 words) to pitch our services.

${baseContext}Target Company: ${lead.company_name}
Contact Person: ${lead.contact_person || 'The Team'}
Service to Pitch: ${lead.targetService || 'Custom Web Development'}
Company Website: ${lead.website_url || 'Unknown'}
Email Type: ${isFollowUp ? 'Follow-up email (brief, polite check-in)' : 'Initial outreach email'}

STRICT RULES:
1. Make it sound 100% human-written and natural.
2. DO NOT use generic AI intro phrases like "In today's fast-paced digital world", "I hope this email finds you well", "I wanted to reach out", or "I was impressed by". Start directly with something relevant.
3. If "CRITICAL LEAD CONTEXT" is provided above, you MUST base the email heavily on those notes. Address their specific pain points mentioned.
4. Briefly mention how Injaazh Global can help them with the "Service to Pitch".
5. Keep it conversational, short, and to the point.
6. DO NOT include the Subject Line in your output, ONLY output the email body text.
7. Sign off as:
   Best,
   Injaazh Global`;

  try {
    const response = await generateAIContent({
      prompt
    });
    return response.success ? response.text : null;
  } catch (error) {
    console.error('Failed to generate AI email:', error);
    return null;
  }
}

/**
 * Execute a single outreach action for a specific lead
 */
export async function executeAutomatedOutreach(leadId: string, isFollowUp = false) {
  try {
    await connectDB();
    
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    const account = await getAvailableEmailAccount();
    if (!account) {
      throw new Error('No available email accounts with remaining quota for today.');
    }

    let emailBody = null;
    if (!isFollowUp && lead.email_draft) {
      // Use the pre-saved draft if it exists and it's the initial outreach
      emailBody = lead.email_draft;
    } else {
      // Generate dynamically via Gemini
      emailBody = await generatePersonalizedEmail(lead, isFollowUp);
    }
    
    if (!emailBody) {
      // Revert quota
      await EmailAccount.findByIdAndUpdate(account._id, { $inc: { sentToday: -1 } });
      throw new Error('AI Generation failed');
    }

    const subject = (!isFollowUp && lead.email_subject_draft) 
      ? lead.email_subject_draft 
      : (isFollowUp 
          ? `Following up regarding ${lead.company_name}` 
          : `Quick question for ${lead.company_name}`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: account.email,
        pass: decrypt(account.appPassword),
      },
    });

    const senderName = account.senderName || 'Injaazh Global';
    const mailOptions: any = {
      from: `"${senderName}" <${account.email}>`,
      to: lead.email,
      subject: subject,
      text: emailBody,
    };

    // If follow up, we could append In-Reply-To if we want it in the same thread.
    // But for now, we just send it.

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendError: any) {
      const errorMsg = sendError.message || '';
      if (errorMsg.includes('Invalid login') || errorMsg.includes('BadCredentials') || errorMsg.includes('535')) {
        // Auth failure: Deactivate account to prevent blocking the rotation loop
        await EmailAccount.findByIdAndUpdate(account._id, { $set: { isActive: false } });
      } else {
        // Revert quota if sending fails for other reasons
        await EmailAccount.findByIdAndUpdate(account._id, { $inc: { sentToday: -1 } });
      }
      throw new Error(`Failed to send email: ${errorMsg}`);
    }

    // Log the email
    await EmailCampaignLog.create({
      leadId: lead._id,
      accountId: account._id,
      messageId: info.messageId, // CRITICAL: Save Message-ID for tracking replies
      type: isFollowUp ? 'Follow-up' : 'Initial',
      status: 'Sent',
    });

    // Update Lead status
    lead.outreach_status = 'Email Sent';
    lead.last_contacted_date = new Date();
    lead.follow_up_count += 1;
    
    // Set next follow-up date to 4 days from now
    const nextFollowUp = new Date();
    nextFollowUp.setDate(nextFollowUp.getDate() + 4);
    lead.nextFollowUpDate = nextFollowUp;
    
    await lead.save();

    return { success: true, messageId: info.messageId };

  } catch (error: any) {
    console.error('Outreach error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch analytics data for the Outreach Dashboard
 */
export async function getOutreachAnalytics() {
  try {
    await connectDB();
    
    // 1. Total Sent (All Time)
    const totalSent = await EmailCampaignLog.countDocuments({ status: 'Sent' });
    
    // 2. Total Replies (All Time)
    const totalReplies = await Lead.countDocuments({ is_replied: true });
    
    // 3. Quota Usage Today (Sum of sentToday across all active accounts)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // LAZY RESET: Ensure quotas are accurate before summing
    await EmailAccount.updateMany(
      { $or: [{ lastResetDate: { $lt: today } }, { lastResetDate: { $exists: false } }] },
      { $set: { sentToday: 0, lastResetDate: new Date() } }
    );
    
    const activeAccounts = await EmailAccount.find({ isActive: true });
    const totalDailyQuota = activeAccounts.reduce((acc, account) => acc + account.dailyLimit, 0);
    const totalSentToday = activeAccounts.reduce((acc, account) => acc + account.sentToday, 0);
    
    // 4. Queued for Today / Future (Active Pipeline)
    const queuedCount = await Lead.countDocuments({
      outreach_status: { $nin: ['Closed', 'Not Interested'] },
      is_replied: false,
      $or: [
        { outreach_scheduled_for: { $gte: today } },
        { nextFollowUpDate: { $gte: today } }
      ]
    });

    return {
      success: true,
      data: {
        totalSent,
        totalReplies,
        totalDailyQuota,
        totalSentToday,
        queuedCount,
      }
    };
  } catch (error: any) {
    console.error('Error fetching outreach analytics:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a sequence step for a lead in a campaign
 */
export async function executeCampaignSequence(campaignLeadId: string) {
  try {
    await connectDB();
    
    const campaignLead = await CampaignLead.findById(campaignLeadId).populate('campaignId').populate('leadId');
    if (!campaignLead) throw new Error('CampaignLead not found');
    if (campaignLead.status !== 'Active') return { success: false, error: 'Lead is not active in this campaign' };

    const campaign: any = campaignLead.campaignId;
    const lead: any = campaignLead.leadId;
    
    if (campaign.status !== 'Active') {
      return { success: false, error: 'Campaign is paused or draft' };
    }
    
    // Safety check: Don't send follow-ups to people who already replied
    if (lead.is_replied || lead.outreach_status === 'Replied') {
      campaignLead.status = 'Replied';
      await campaignLead.save();
      return { success: false, error: 'Lead already replied. Automation stopped.' };
    }
    
    const step = campaign.sequences.find((s: any) => s.stepNumber === campaignLead.currentStep);
    if (!step) {
      campaignLead.status = 'Finished';
      await campaignLead.save();
      
      // Auto-complete the campaign if no active leads are left
      const remainingActive = await CampaignLead.countDocuments({ 
        campaignId: campaign._id, 
        status: 'Active',
        _id: { $ne: campaignLead._id } // exclude the one we just finished
      });
      
      if (remainingActive === 0) {
        const Campaign = (await import('@/models/Campaign')).Campaign;
        await Campaign.findByIdAndUpdate(campaign._id, { status: 'Completed' });
      }
      
      return { success: true, finished: true };
    }

    const account = await getAvailableEmailAccount();
    if (!account) {
      throw new Error('No available email accounts with remaining quota for today.');
    }

    let emailBody = step.bodyTemplate;
    let subject = step.subjectTemplate;
    
    // Simple template replacement
    const replaceVars = (text: string) => {
      return text.replace(/{{company_name}}/g, lead.company_name)
                 .replace(/{{contact_person}}/g, lead.contact_person || 'there')
                 .replace(/{{website_url}}/g, lead.website_url || '');
    };
    
    if (step.useAI) {
      const baseContext = lead.lead_context ? `CRITICAL LEAD CONTEXT: ${lead.lead_context}\n\n` : '';
      const prompt = `You are a highly skilled Sales Executive. Your goal is to write a highly personalized outreach email based on this specific prompt instructions.\n\n${baseContext}Target Company: ${lead.company_name}\nContact Person: ${lead.contact_person || 'The Team'}\nWebsite: ${lead.website_url || 'Unknown'}\n\nPrompt Instructions for this step:\n${step.bodyTemplate}\n\nDO NOT include the Subject Line in your output, ONLY output the email body text. Make it sound 100% human-written.`;
      
      const response = await generateAIContent({ prompt });
      if (!response.success) {
        await EmailAccount.findByIdAndUpdate(account._id, { $inc: { sentToday: -1 } });
        
        // Log AI Failure so it shows up on the dashboard
        await EmailCampaignLog.create({
          leadId: lead._id,
          accountId: account._id,
          campaignId: campaignLead.campaignId,
          messageId: `failed-ai-${Date.now()}`,
          type: campaignLead.currentStep === 1 ? 'Initial' : 'Follow-up',
          status: 'Failed',
          errorMessage: response.error || 'AI Generation failed'
        });
        
        throw new Error(response.error || 'AI Generation failed');
      }
      emailBody = response.text;
      subject = replaceVars(subject);
    } else {
      emailBody = replaceVars(emailBody);
      subject = replaceVars(subject);
    }

    const { parseSpintax } = await import('@/lib/spintax');
    emailBody = parseSpintax(emailBody);
    subject = parseSpintax(subject);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: account.email, pass: decrypt(account.appPassword) },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    const senderName = account.senderName || 'Injaazh Global';
    
    // Add a simple opt-out footer to improve deliverability
    const footer = `\n\n--\nIf you don't wish to receive these emails, simply reply "Unsubscribe".`;
    const finalEmailBody = emailBody + footer;
    
    // Format as HTML to look better and improve inbox rate
    const htmlBody = finalEmailBody.replace(/\n/g, '<br>');

    // We need an ID for tracking before we send the email
    const logId = new mongoose.Types.ObjectId();

    // Link Rewriting for Click Tracking
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let trackableHtmlBody = htmlBody.replace(/href="([^"]+)"/g, (match, url) => {
      // Don't rewrite mailto or tel links
      if (url.startsWith('mailto:') || url.startsWith('tel:')) return match;
      const encodedUrl = encodeURIComponent(url);
      return `href="${baseUrl}/api/track?type=click&logId=${logId.toString()}&url=${encodedUrl}"`;
    });

    // Tracking Pixel for Open Tracking
    const trackingPixel = `<img src="${baseUrl}/api/track?type=open&logId=${logId.toString()}" width="1" height="1" alt="" style="display:none;" />`;
    trackableHtmlBody += trackingPixel;

    const mailOptions: any = {
      from: `"${senderName}" <${account.email}>`,
      to: lead.email,
      subject: subject,
      text: finalEmailBody,
      html: `<div style="font-family: sans-serif; font-size: 14px; color: #333;">${trackableHtmlBody}</div>`,
      headers: {
        'List-Unsubscribe': `<mailto:${account.email}?subject=Unsubscribe>`,
        'Precedence': 'bulk'
      }
    };

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (sendError: any) {
      const errorMsg = sendError.message || '';
      if (errorMsg.includes('Invalid login') || errorMsg.includes('BadCredentials') || errorMsg.includes('535')) {
        await EmailAccount.findByIdAndUpdate(account._id, { $set: { isActive: false } });
      } else {
        await EmailAccount.findByIdAndUpdate(account._id, { $inc: { sentToday: -1 } });
      }
      
      // Log failure
      await EmailCampaignLog.create({
        _id: logId,
        leadId: lead._id,
        accountId: account._id,
        campaignId: campaignLead.campaignId,
        messageId: `failed-${Date.now()}`,
        type: campaignLead.currentStep === 1 ? 'Initial' : 'Follow-up',
        status: 'Failed',
        errorMessage: errorMsg
      });
      
      throw new Error(`Failed to send email: ${errorMsg}`);
    }

    await EmailCampaignLog.create({
      _id: logId,
      leadId: lead._id,
      accountId: account._id,
      campaignId: campaignLead.campaignId,
      messageId: info.messageId,
      type: campaignLead.currentStep === 1 ? 'Initial' : 'Follow-up',
      status: 'Sent',
    });

    // Update Lead status
    lead.outreach_status = 'Email Sent';
    lead.last_contacted_date = new Date();
    await lead.save();

    // Advance CampaignLead step
    const nextStepNum = campaignLead.currentStep + 1;
    const nextStep = campaign.sequences.find((s: any) => s.stepNumber === nextStepNum);
    
    if (nextStep) {
      campaignLead.currentStep = nextStepNum;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextStep.delayDays);
      campaignLead.nextActionDate = nextDate;
    } else {
      campaignLead.status = 'Finished';
    }
    
    await campaignLead.save();

    // Auto-complete the campaign if no active leads are left
    if (!nextStep) {
      const remainingActive = await CampaignLead.countDocuments({ 
        campaignId: campaign._id, 
        status: 'Active'
      });
      
      if (remainingActive === 0) {
        // Use findByIdAndUpdate since campaign is a populated subdoc here
        const Campaign = (await import('@/models/Campaign')).Campaign;
        await Campaign.findByIdAndUpdate(campaign._id, { status: 'Completed' });
      }
    }

    return { success: true, messageId: info.messageId };

  } catch (error: any) {
    console.error('Campaign Outreach error:', error);
    return { success: false, error: error.message };
  }
}

export async function forceRunCampaign(campaignId: string) {
  try {
    console.log(`[FORCE RUN] Starting force run for campaign: ${campaignId}`);
    await connectDB();
    const activeCampaignLeads = await CampaignLead.find({
      campaignId,
      status: 'Active',
      nextActionDate: { $lte: new Date() }
    });

    console.log(`[FORCE RUN] Found ${activeCampaignLeads.length} eligible active leads.`);

    if (activeCampaignLeads.length === 0) {
      return { success: true, message: 'No eligible leads found to process right now.' };
    }

    const { after } = await import('next/server');
    console.log(`[FORCE RUN] [${new Date().toISOString()}] Started campaign run for ${activeCampaignLeads.length} leads`);

    after(async () => {
      let processedCount = 0;
      for (const cl of activeCampaignLeads) {
        console.log(`[FORCE RUN] [${new Date().toISOString()}] Processing lead: ${cl.leadId}`);
        try {
          const res = await executeCampaignSequence(cl._id.toString());
          if (res.success) {
            processedCount++;
            console.log(`[FORCE RUN] [${new Date().toISOString()}] Successfully sent email to lead: ${cl.leadId}`);
          } else {
            console.error(`[FORCE RUN] [${new Date().toISOString()}] Error for lead ${cl.leadId}: ${res.error}`);
          }
        } catch (e: any) {
          console.error(`[FORCE RUN] [${new Date().toISOString()}] CRASH for lead ${cl.leadId}: ${e.message}\n${e.stack}`);
        }
        
        const randomDelayMs = Math.floor(Math.random() * (240000 - 120000 + 1)) + 120000;
        console.log(`[FORCE RUN] [${new Date().toISOString()}] Waiting ${Math.round(randomDelayMs / 1000)} seconds...`);
        await new Promise(r => setTimeout(r, randomDelayMs));
      }
      console.log(`[FORCE RUN] [${new Date().toISOString()}] Finished processing ${processedCount} leads`);
    });

    return { success: true, message: `Successfully started sending to ${activeCampaignLeads.length} leads in the background. Emails will be sent 2-4 mins apart.` };
  } catch (error: any) {
    console.error(`[FORCE RUN] Fatal error:`, error);
    return { success: false, error: error.message };
  }
}

export async function syncInboxesAction() {
  try {
    await checkAllInboxes();
    return { success: true };
  } catch (error: any) {
    console.error('Error syncing inboxes:', error);
    return { success: false, error: error.message };
  }
}
