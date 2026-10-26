'use server';

import connectDB from '@/lib/mongodb';
import { AiKey } from '@/models/AiKey';
import { revalidatePath } from 'next/cache';
import { getAuthUser, requireWriteAuth } from '@/lib/auth';

function maskApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return '••••••••••••••••';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••••••••••';
  return `${trimmed.substring(0, 4)}••••••••${trimmed.substring(trimmed.length - 4)}`;
}

export async function getAiKeys() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthorized: Authentication required.', data: [] };
    }

    if (authUser.role === 'viewer') {
      return { success: false, error: 'Demo / View-Only Mode: AI keys are restricted.', data: [] };
    }

    await connectDB();
    const keys = await AiKey.find({}).sort({ createdAt: -1 }).lean();

    const isPrivileged = authUser.role === 'admin' || authUser.role === 'owner';
    const serialized = keys.map((k: any) => ({
      _id: k._id.toString(),
      provider: k.provider,
      name: k.name || '',
      modelId: k.modelId || '',
      dailyLimit: k.dailyLimit || 50,
      sentToday: k.sentToday || 0,
      isActive: Boolean(k.isActive),
      apiKey: isPrivileged ? k.apiKey : maskApiKey(k.apiKey),
      createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : new Date().toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error: any) {
    console.error('Failed to get AI keys:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to retrieve AI keys', data: [] };
  }
}

export async function addAiKey(data: { provider: string; apiKey: string; name?: string; modelId?: string; dailyLimit?: number }) {
  try {
    const authUser = await requireWriteAuth();
    if (authUser.role !== 'admin' && authUser.role !== 'owner') {
      throw new Error('Unauthorized: Admin or owner role required to configure AI keys.');
    }

    if (!data.provider || !data.apiKey) {
      return { success: false, error: 'Provider and API Key are required.' };
    }

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
    console.error('Failed to add AI key:', error?.message || 'Unknown error');
    return { success: false, error: error?.message || 'Failed to add AI key' };
  }
}

export async function deleteAiKey(id: string) {
  try {
    const authUser = await requireWriteAuth();
    if (authUser.role !== 'admin' && authUser.role !== 'owner') {
      throw new Error('Unauthorized: Admin or owner role required to manage AI keys.');
    }

    await connectDB();
    await AiKey.findByIdAndDelete(id);
    revalidatePath('/settings');
    return { success: true, message: 'AI Key deleted successfully' };
  } catch (error: any) {
    console.error('Failed to delete AI key:', error?.message || 'Unknown error');
    return { success: false, error: error?.message || 'Failed to delete AI key' };
  }
}

export async function toggleAiKeyStatus(id: string, currentStatus: boolean) {
  try {
    const authUser = await requireWriteAuth();
    if (authUser.role !== 'admin' && authUser.role !== 'owner') {
      throw new Error('Unauthorized: Admin or owner role required to manage AI keys.');
    }

    await connectDB();
    await AiKey.findByIdAndUpdate(id, { isActive: !currentStatus });
    revalidatePath('/settings');
    return { success: true, message: 'AI Key status updated' };
  } catch (error: any) {
    console.error('Failed to toggle AI key status:', error?.message || 'Unknown error');
    return { success: false, error: error?.message || 'Failed to update AI key status' };
  }
}
