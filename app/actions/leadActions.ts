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
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { outreach_status: newStatus },
      { new: true }
    ).lean();
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
    
    revalidatePath('/leads');
    return { success: true, data: JSON.parse(JSON.stringify(updatedLead)) };
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return { success: false, error: error.message };
  }
}
