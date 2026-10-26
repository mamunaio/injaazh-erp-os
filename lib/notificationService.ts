/**
 * Internal Notification Service
 *
 * Server-side notification creation helper.
 * This module does NOT declare 'use server' to ensure internal notification creation
 * cannot be invoked directly as an unauthenticated Next.js Server Action RPC.
 */

import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { revalidatePath } from 'next/cache';

const ALLOWED_TYPES = ['payment', 'lead', 'system', 'proposal'] as const;
type NotificationType = typeof ALLOWED_TYPES[number];

/**
 * Validates link URL safety
 */
function isSafeLink(link?: string): boolean {
  if (!link) return true;
  const trimmed = link.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return false;
  }
  return true;
}

/**
 * Internal notification creation function
 */
export async function createNotification(
  type: NotificationType,
  message: string,
  link?: string
) {
  try {
    // Validate type
    if (!ALLOWED_TYPES.includes(type)) {
      return { success: false, error: `Invalid notification type: ${type}` };
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return { success: false, error: 'Notification message cannot be empty' };
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length > 1000) {
      return { success: false, error: 'Notification message exceeds maximum allowed length of 1000 characters' };
    }

    // Validate link
    if (link && !isSafeLink(link)) {
      return { success: false, error: 'Unsafe notification link rejected' };
    }

    await connectToDatabase();
    const notif = await Notification.create({
      type,
      message: cleanMessage,
      link: link ? link.trim() : ''
    });

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Ignore revalidation errors in non-request contexts
    }

    return { success: true, data: JSON.parse(JSON.stringify(notif)) };
  } catch (error: any) {
    console.error('Failed to create notification:', error?.message || 'Unknown error');
    return { success: false, error: 'Failed to create notification' };
  }
}
