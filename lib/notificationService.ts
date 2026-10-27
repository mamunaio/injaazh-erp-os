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

import mongoose from 'mongoose';

const ALLOWED_TYPES = ['payment', 'lead', 'system', 'proposal'] as const;
type NotificationType = typeof ALLOWED_TYPES[number];

const ALLOWED_ROLES = ['owner', 'admin', 'editor', 'marketplace_team', 'viewer'] as const;
export type UserRole = typeof ALLOWED_ROLES[number];

export interface CreateNotificationOptions {
  userId?: string | mongoose.Types.ObjectId | null;
  targetRoles?: UserRole[];
  createdBy?: string | mongoose.Types.ObjectId | null;
}

/**
 * Returns default authorized roles based on notification category
 */
export function getDefaultRolesForType(type: NotificationType): UserRole[] {
  switch (type) {
    case 'payment':
      // Financial transactions restricted strictly to owner and admin
      return ['owner', 'admin'];
    case 'system':
      // System management events restricted to owner and admin
      return ['owner', 'admin'];
    case 'proposal':
      return ['owner', 'admin', 'editor', 'marketplace_team'];
    case 'lead':
      return ['owner', 'admin', 'editor', 'marketplace_team'];
    default:
      return ['owner', 'admin'];
  }
}

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
  link?: string,
  options?: CreateNotificationOptions
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

    // Determine target roles
    const targetRoles: UserRole[] = options?.targetRoles && options.targetRoles.length > 0
      ? options.targetRoles.filter(r => ALLOWED_ROLES.includes(r))
      : getDefaultRolesForType(type);

    let parsedUserId: any = null;
    if (options?.userId) {
      if (mongoose.Types.ObjectId.isValid(options.userId.toString())) {
        parsedUserId = new mongoose.Types.ObjectId(options.userId.toString());
      } else {
        parsedUserId = options.userId;
      }
    }

    let parsedCreatedBy: any = null;
    if (options?.createdBy) {
      if (mongoose.Types.ObjectId.isValid(options.createdBy.toString())) {
        parsedCreatedBy = new mongoose.Types.ObjectId(options.createdBy.toString());
      } else {
        parsedCreatedBy = options.createdBy;
      }
    }

    await connectToDatabase();
    const notif = await Notification.create({
      type,
      message: cleanMessage,
      link: link ? link.trim() : '',
      userId: parsedUserId,
      targetRoles,
      createdBy: parsedCreatedBy,
      readBy: [],
      dismissedBy: [],
      isRead: false
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
