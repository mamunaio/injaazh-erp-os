'use server';

import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { revalidatePath } from 'next/cache';
import { getAuthUser, requireWriteAuth } from '@/lib/auth';

export async function getRecentNotifications() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return {
        notifications: [],
        unreadCount: 0
      };
    }

    await connectToDatabase();
    const [notifications, totalUnread] = await Promise.all([
      Notification.find({})
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
      Notification.countDocuments({ isRead: false })
    ]);

    // Serialize safely for client components
    const serialized = notifications.map((notif: any) => ({
      _id: notif._id.toString(),
      type: notif.type || 'system',
      message: notif.message || '',
      isRead: Boolean(notif.isRead),
      link: notif.link || '',
      createdAt: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString()
    }));

    return {
      notifications: serialized,
      unreadCount: totalUnread
    };
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return {
      notifications: [],
      unreadCount: 0
    };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await requireWriteAuth();
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
    await requireWriteAuth();
    await connectToDatabase();
    await Notification.updateMany({ isRead: false }, { isRead: true });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return { success: false, error: 'Failed to update notifications' };
  }
}

export async function clearReadNotifications() {
  try {
    await requireWriteAuth();
    await connectToDatabase();
    await Notification.deleteMany({ isRead: true });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to clear read notifications:', error);
    return { success: false, error: 'Failed to clear read notifications' };
  }
}
