'use server';

import connectToDatabase from '@/lib/mongodb';
import { Proposal } from '@/models/Proposal';
import { revalidatePath } from 'next/cache';

export async function clearAllProposals() {
  try {
    await connectToDatabase();
    
    // Delete all proposals
    const result = await Proposal.deleteMany({});
    
    console.log(`Deleted ${result.deletedCount} proposals`);
    
    revalidatePath('/proposals');
    
    return { 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} proposals`,
      count: result.deletedCount 
    };
  } catch (error: any) {
    console.error('Error clearing proposals:', error);
    return { success: false, error: error.message };
  }
}

export async function clearDemoProposals() {
  try {
    await connectToDatabase();
    
    // Delete only the seed/demo proposals by matching known demo client names
    const demoClients = [
      'Acme Corp',
      'Globex Inc',
      'Initech',
      'Soylent Corp',
      'Wayne Enterprises'
    ];
    
    const result = await Proposal.deleteMany({
      clientName: { $in: demoClients }
    });
    
    console.log(`Deleted ${result.deletedCount} demo proposals`);
    
    revalidatePath('/proposals');
    
    return { 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} demo proposals`,
      count: result.deletedCount 
    };
  } catch (error: any) {
    console.error('Error clearing demo proposals:', error);
    return { success: false, error: error.message };
  }
}
