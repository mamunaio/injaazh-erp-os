'use server';

import connectDB from '@/lib/mongodb';
import { AiKey } from '@/models/AiKey';
import { revalidatePath } from 'next/cache';

export async function getAiKeys() {
  try {
    await connectDB();
    const keys = await AiKey.find({}).sort({ createdAt: -1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(keys)) };
  } catch (error: any) {
    console.error('Failed to get AI keys:', error);
    return { success: false, error: error.message };
  }
}

export async function addAiKey(data: { provider: string; apiKey: string; name?: string; modelId?: string; dailyLimit?: number }) {
  try {
    await connectDB();
    const newKey = new AiKey({
      provider: data.provider,
      apiKey: data.apiKey,
      name: data.name,
      modelId: data.modelId,
      dailyLimit: data.dailyLimit || 50,
    });
    await newKey.save();
    revalidatePath('/settings');
    return { success: true, message: 'AI Key added successfully' };
  } catch (error: any) {
    console.error('Failed to add AI key:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAiKey(id: string) {
  try {
    await connectDB();
    await AiKey.findByIdAndDelete(id);
    revalidatePath('/settings');
    return { success: true, message: 'AI Key deleted successfully' };
  } catch (error: any) {
    console.error('Failed to delete AI key:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleAiKeyStatus(id: string, currentStatus: boolean) {
  try {
    await connectDB();
    await AiKey.findByIdAndUpdate(id, { isActive: !currentStatus });
    revalidatePath('/settings');
    return { success: true, message: 'AI Key status updated' };
  } catch (error: any) {
    console.error('Failed to toggle AI key status:', error);
    return { success: false, error: error.message };
  }
}
