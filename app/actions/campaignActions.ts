'use server';

import connectDB from '@/lib/mongodb';
import { Campaign } from '@/models/Campaign';
import { CampaignLead } from '@/models/CampaignLead';
import { revalidatePath } from 'next/cache';

export async function getCampaigns() {
  try {
    await connectDB();
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
    const { EmailCampaignLog } = await import('@/models/EmailCampaignLog');
    
    // Fetch lead counts and tracking stats for each campaign
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (camp) => {
        const leadCount = await CampaignLead.countDocuments({ campaignId: camp._id });
        
        // Get all lead IDs for this campaign for computing replies and converted
        const campaignLeads = await CampaignLead.find({ campaignId: camp._id }).select('leadId').lean();
        const leadIds = campaignLeads.map(cl => cl.leadId);
        
        // Fetch logs for this campaign using campaignId (if present), fallback to leadId for backwards compatibility
        const logs = await EmailCampaignLog.find({ 
          $or: [
            { campaignId: camp._id },
            { leadId: { $in: leadIds } }
          ],
          status: 'Sent' 
        }).lean();
        
        // Only count logs that ACTUALLY belong to this campaign if possible.
        // For backwards compatibility we still include leadId match, but since it causes bugs, 
        // we should really just count the logs that match the campaign. Wait, old logs don't have campaignId!
        // So for old campaigns, we'll just count logs by leadId. For new ones, it's safer to use campaignId.
        // Actually, if we use $or, it will still match old manual emails. 
        // To fix the "Emails Sent: 5" bug perfectly:
        let campaignLogs = logs;
        if (logs.some(l => l.campaignId)) {
           // If ANY log has a campaignId, filter to ONLY this campaign!
           campaignLogs = logs.filter((l: any) => l.campaignId && l.campaignId.toString() === camp._id.toString());
        } else {
           // If no logs have campaignId (old data), just use all logs for these leads
           campaignLogs = logs;
        }

        const emailsSent = campaignLogs.length;
        const opens = campaignLogs.filter((log: any) => log.openedAt != null).length;
        const clicks = campaignLogs.filter((log: any) => log.clicks > 0).length;
        
        // Get replies from Lead model
        const { Lead } = await import('@/models/Lead');
        const replied = await Lead.countDocuments({ _id: { $in: leadIds }, is_replied: true });
        
        const converted = await Lead.countDocuments({ _id: { $in: leadIds }, outreach_status: 'Closed' });

        const deliveryRate = emailsSent > 0 ? 100 : 0; // Simplified delivery rate
        const openRate = emailsSent > 0 ? Math.round((opens / emailsSent) * 100) : 0;
        const clickRate = emailsSent > 0 ? Math.round((clicks / emailsSent) * 100) : 0;

        return { 
          ...camp, 
          leadCount, 
          emailsSent, 
          opens, 
          clicks, 
          replied, 
          converted,
          deliveryRate,
          openRate,
          clickRate
        };
      })
    );
    
    return { success: true, campaigns: JSON.parse(JSON.stringify(campaignsWithStats)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCampaign(data: any) {
  try {
    await connectDB();
    const campaign = await Campaign.create(data);
    revalidatePath('/campaigns');
    return { success: true, campaign: JSON.parse(JSON.stringify(campaign)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCampaign(id: string, data: any) {
  try {
    await connectDB();
    const campaign = await Campaign.findByIdAndUpdate(id, data, { new: true });
    revalidatePath('/campaigns');
    return { success: true, campaign: JSON.parse(JSON.stringify(campaign)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCampaignStatus(id: string, status: string) {
  try {
    await connectDB();
    await Campaign.findByIdAndUpdate(id, { status });
    revalidatePath('/campaigns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCampaign(id: string) {
  try {
    await connectDB();
    // Delete the campaign
    await Campaign.findByIdAndDelete(id);
    // Delete associated CampaignLeads
    await CampaignLead.deleteMany({ campaignId: id });
    revalidatePath('/campaigns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLeadsToCampaign(campaignId: string, leadIds: string[]) {
  try {
    await connectDB();
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const operations = leadIds.map(leadId => ({
      updateOne: {
        filter: { campaignId, leadId },
        update: {
          $setOnInsert: {
            campaignId,
            leadId,
            status: 'Active',
            currentStep: 1,
            nextActionDate: new Date(),
          }
        },
        upsert: true
      }
    }));

    await CampaignLead.bulkWrite(operations as any);
    
    revalidatePath('/campaigns');
    revalidatePath('/prospects');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCampaignStats(campaignId: string) {
  try {
    await connectDB();
    const totalLeads = await CampaignLead.countDocuments({ campaignId });
    const activeLeads = await CampaignLead.countDocuments({ campaignId, status: 'Active' });
    const repliedLeads = await CampaignLead.countDocuments({ campaignId, status: 'Replied' });
    const finishedLeads = await CampaignLead.countDocuments({ campaignId, status: 'Finished' });

    return {
      success: true,
      stats: { totalLeads, activeLeads, repliedLeads, finishedLeads }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCampaignLogs(campaignId: string) {
  try {
    await connectDB();
    const mongoose = require('mongoose');
    
    // 1. Find all leads in this campaign
    const campaignLeads = await CampaignLead.find({ campaignId }).select('leadId').lean();
    const leadIds = campaignLeads.map(cl => cl.leadId);

    // 2. Find logs for those leads
    // We import EmailCampaignLog inside to avoid circular deps if any
    const { EmailCampaignLog } = await import('@/models/EmailCampaignLog');
    
    const logs = await EmailCampaignLog.find({ leadId: { $in: leadIds } })
      .populate('leadId', 'company_name contact_person email')
      .sort({ sentAt: -1 })
      .limit(50)
      .lean();

    return { success: true, logs: JSON.parse(JSON.stringify(logs)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCampaignLeads(campaignId: string) {
  try {
    await connectDB();
    const campaignLeads = await CampaignLead.find({ campaignId })
      .populate('leadId')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, leads: JSON.parse(JSON.stringify(campaignLeads)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importCSVToCampaign(campaignId: string, mappedData: any[]) {
  try {
    await connectDB();
    const { Lead } = await import('@/models/Lead');
    
    // Create Leads
    const newLeads = await Lead.insertMany(
      mappedData.map(data => ({
        ...data,
        source: 'CSV Upload (Campaign)',
        outreach_status: 'New',
        outreach_scheduled_for: new Date()
      }))
    );

    // Link to Campaign
    const nextActionDate = new Date();
    const operations = newLeads.map(lead => ({
      campaignId,
      leadId: lead._id,
      status: 'Active',
      currentStep: 1,
      nextActionDate
    }));

    await CampaignLead.insertMany(operations as any);
    revalidatePath('/campaigns');
    
    return { success: true, count: newLeads.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeLeadFromCampaign(campaignLeadId: string) {
  try {
    await connectDB();
    await CampaignLead.findByIdAndDelete(campaignLeadId);
    revalidatePath('/campaigns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCampaignLeadInfo(leadId: string, data: any) {
  try {
    await connectDB();
    const { Lead } = await import('@/models/Lead');
    await Lead.findByIdAndUpdate(leadId, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
