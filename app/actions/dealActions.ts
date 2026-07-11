'use server';

import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/mongodb';
import { Deal } from '@/models/Deal';
import { getAuthUser } from '@/lib/auth';

export async function getDeals() {
  try {
    await connectToDatabase();
    const currentUser = await getAuthUser();
    
    let query = {};
    // If not admin/owner, they only see deals they own. Or maybe all users can see all deals? 
    // Usually sales users only see their own. For simplicity, we'll follow similar logic to leads.
    if (currentUser && currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      query = { owner: currentUser.id };
    }

    const deals = await Deal.find(query)
      .populate('owner', 'name image')
      .sort({ createdAt: -1 })
      .lean();
      
    return { success: true, data: JSON.parse(JSON.stringify(deals)) };
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return { success: false, error: error.message };
  }
}

export async function createDeal(data: any) {
  try {
    await connectToDatabase();
    const currentUser = await getAuthUser();
    
    if (currentUser) {
      data.owner = currentUser.id;
    }
    
    const newDeal = new Deal(data);
    await newDeal.save();
    
    revalidatePath('/deals');
    return { success: true, data: JSON.parse(JSON.stringify(newDeal)) };
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDeal(id: string, updateData: any) {
  try {
    await connectToDatabase();
    
    const updatedDeal = await Deal.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean();
    
    revalidatePath('/deals');
    return { success: true, data: JSON.parse(JSON.stringify(updatedDeal)) };
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDeal(id: string) {
  try {
    await connectToDatabase();
    await Deal.findByIdAndDelete(id);
    
    revalidatePath('/deals');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    return { success: false, error: error.message };
  }
}
