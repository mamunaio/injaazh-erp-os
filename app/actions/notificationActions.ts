'use server';

import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { revalidatePath } from 'next/cache';

export async function getRecentNotifications() {
  try {
    await connectToDatabase();
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Serialize for client components
    return notifications.map(notif => ({
      _id: notif._id.toString(),
      type: notif.type,
      message: notif.message,
      isRead: notif.isRead,
      createdAt: notif.createdAt.toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await connectToDatabase();
    await Notification.findByIdAndUpdate(id, { isRead: true });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, error: 'Failed to update notification' };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    await connectToDatabase();
    await Notification.updateMany({ isRead: false }, { isRead: true });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return { success: false, error: 'Failed to update notifications' };
  }
}

export async function createNotification(type: 'payment' | 'lead' | 'system' | 'proposal', message: string) {
  try {
    await connectToDatabase();
    await Notification.create({ type, message });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to create notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}
