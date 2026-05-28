'use server';

import dbConnect from '@/lib/mongodb';
import MarketplaceClient from '@/models/MarketplaceClient';
import { revalidatePath } from 'next/cache';

export async function getMarketplaceClients() {
  try {
    await dbConnect();
    const clients = await MarketplaceClient.find().sort({ createdAt: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(clients)) };
  } catch (error: any) {
    console.error('Error fetching marketplace clients:', error);
    return { success: false, error: error.message || 'Failed to fetch clients' };
  }
}

export async function getMarketplaceClientById(id: string) {
  try {
    await dbConnect();
    const client = await MarketplaceClient.findById(id);
    if (!client) {
      return { success: false, error: 'Client not found' };
    }
    return { success: true, data: JSON.parse(JSON.stringify(client)) };
  } catch (error: any) {
    console.error('Error fetching client by id:', error);
    return { success: false, error: error.message || 'Failed to fetch client' };
  }
}

export async function createMarketplaceClient(data: any) {
  try {
    await dbConnect();
    const newClient = await MarketplaceClient.create(data);
    
    // Revalidate paths that might display this data
    revalidatePath('/marketplace');
    revalidatePath('/marketplace/clients');
    revalidatePath('/marketplace/[platform]', 'page');
    
    return { success: true, data: JSON.parse(JSON.stringify(newClient)) };
  } catch (error: any) {
    console.error('Error creating client:', error);
    return { success: false, error: error.message || 'Failed to create client' };
  }
}

export async function updateMarketplaceClient(id: string, data: any) {
  try {
    await dbConnect();
    const updatedClient = await MarketplaceClient.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    if (!updatedClient) {
      return { success: false, error: 'Client not found' };
    }

    revalidatePath('/marketplace');
    revalidatePath('/marketplace/clients');
    revalidatePath('/marketplace/[platform]', 'page');

    return { success: true, data: JSON.parse(JSON.stringify(updatedClient)) };
  } catch (error: any) {
    console.error('Error updating client:', error);
    return { success: false, error: error.message || 'Failed to update client' };
  }
}

export async function deleteMarketplaceClient(id: string) {
  try {
    await dbConnect();
    const deletedClient = await MarketplaceClient.findByIdAndDelete(id);
    
    if (!deletedClient) {
      return { success: false, error: 'Client not found' };
    }

    revalidatePath('/marketplace');
    revalidatePath('/marketplace/clients');
    revalidatePath('/marketplace/[platform]', 'page');

    return { success: true, message: 'Client deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return { success: false, error: error.message || 'Failed to delete client' };
  }
}
