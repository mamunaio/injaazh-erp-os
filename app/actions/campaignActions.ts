'use server';

import connectDB from '@/lib/mongodb';
import { Campaign } from '@/models/Campaign';
import { CampaignLead } from '@/models/CampaignLead';
import { revalidatePath } from 'next/cache';

export async function getCampaigns() {
  try {
    await connectDB();
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
    
    // Fetch lead counts for each campaign
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (camp) => {
        const leadCount = await CampaignLead.countDocuments({ campaignId: camp._id });
        return { ...camp, leadCount };
      })
    );
    
    return { success: true, campaigns: JSON.parse(JSON.stringify(campaignsWithCounts)) };
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
