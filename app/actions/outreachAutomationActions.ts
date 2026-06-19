'use server';

import connectDB from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { EmailAccount } from '@/models/EmailAccount';
import { EmailCampaignLog } from '@/models/EmailCampaignLog';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Automatically select an available email account that hasn't reached its daily limit.
 */
async function getAvailableEmailAccount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find active accounts where sentToday < dailyLimit
  const account = await EmailAccount.findOneAndUpdate(
    {
      isActive: true,
      $expr: { $lt: ['$sentToday', '$dailyLimit'] },
    },
    { $inc: { sentToday: 1 } },
    { new: true, sort: { sentToday: 1 } } // Pick the one with least sent today
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
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
        pass: account.appPassword,
      },
    });

    const mailOptions: any = {
      from: account.email,
      to: lead.email,
      subject: subject,
      text: emailBody,
    };

    // If follow up, we could append In-Reply-To if we want it in the same thread.
    // But for now, we just send it.

    const info = await transporter.sendMail(mailOptions);

    // Log the campaign
    await EmailCampaignLog.create({
      leadId: lead._id,
      accountId: account._id,
      messageId: info.messageId, // CRITICAL: Save Message-ID for tracking replies
      type: isFollowUp ? 'Follow-up' : 'Initial',
      status: 'Sent',
    });

    // Update Lead status
    lead.outreach_status = 'Contacted';
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
    const activeAccounts = await EmailAccount.find({ isActive: true });
    const totalDailyQuota = activeAccounts.reduce((acc, account) => acc + account.dailyLimit, 0);
    const totalSentToday = activeAccounts.reduce((acc, account) => acc + account.sentToday, 0);
    
    // 4. Queued for Today / Future (Active Pipeline)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
