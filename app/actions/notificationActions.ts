'use server';

import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { revalidatePath } from 'next/cache';
import { getAuthUser, requireWriteAuth, UserJwtPayload } from '@/lib/auth';

/**
 * Builds user-isolated visibility filter for querying and mutating notifications.
 * Ensures:
 * 1. Notifications dismissed by the user are excluded.
 * 2. User sees only notifications targeted directly to them or their assigned role.
 * 3. Legacy records without targeting metadata default safely to 'owner' only.
 */
function buildUserVisibilityFilter(userIdStr: string, role: string) {
  const userIdentifiers: any[] = [userIdStr];
  if (mongoose.Types.ObjectId.isValid(userIdStr)) {
    userIdentifiers.push(new mongoose.Types.ObjectId(userIdStr));
  }

  // Exclude notifications dismissed by this user
  const notDismissed = {
    dismissedBy: { $nin: userIdentifiers }
  };

  // Audience targeting clauses:
  // Clause A: Direct user targeting
  // Clause B: Role targeting (broadcast only: userId must be absent or null)
  const audienceClauses: any[] = [
    { userId: { $in: userIdentifiers } },
    {
      targetRoles: role,
      $or: [{ userId: { $exists: false } }, { userId: null }]
    }
  ];

  // Clause C: Legacy fallback (records lacking targetRoles and userId)
  // Restricted strictly to 'owner' for safety; non-owner roles (editor, marketplace_team, viewer)
  // are NEVER exposed to unclassified legacy notifications.
  if (role === 'owner') {
    audienceClauses.push({
      $and: [
        { $or: [{ userId: { $exists: false } }, { userId: null }] },
        { $or: [{ targetRoles: { $exists: false } }, { targetRoles: { $size: 0 } }] }
      ]
    });
  }

  return {
    ...notDismissed,
    $or: audienceClauses
  };
}

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

    const visibilityFilter = buildUserVisibilityFilter(user.id, user.role);
    const userIdentifiers: any[] = [user.id];
    if (mongoose.Types.ObjectId.isValid(user.id)) {
      userIdentifiers.push(new mongoose.Types.ObjectId(user.id));
    }

    const [notifications, totalUnread] = await Promise.all([
      Notification.find(visibilityFilter)
        .sort({ createdAt: -1 })
        .limit(25)
        .lean(),
      Notification.countDocuments({
        $and: [
          visibilityFilter,
          { readBy: { $nin: userIdentifiers } },
          { isRead: { $ne: true } }
        ]
      })
    ]);

    // Serialize safely for client components with per-user read calculation
    const serialized = notifications.map((notif: any) => {
      const isReadByUser = Boolean(
        (Array.isArray(notif.readBy) && notif.readBy.some((id: any) => id?.toString() === user.id)) ||
        notif.isRead === true
      );

      return {
        _id: notif._id.toString(),
        type: notif.type || 'system',
        message: notif.message || '',
        isRead: isReadByUser,
        link: notif.link || '',
        createdAt: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString()
      };
    });

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
    const user = await requireWriteAuth();
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return { success: false, error: 'Invalid notification ID' };
    }

    await connectToDatabase();

    const visibilityFilter = buildUserVisibilityFilter(user.id, user.role);
    const userIdentifier = mongoose.Types.ObjectId.isValid(user.id)
      ? new mongoose.Types.ObjectId(user.id)
      : user.id;

    let filterId: any = id.trim();
    if (mongoose.Types.ObjectId.isValid(filterId)) {
      filterId = new mongoose.Types.ObjectId(filterId);
    }

    // Enforce visibility filter: user cannot mark another user's private notification as read
    const result = await Notification.updateOne(
      {
        $and: [
          { _id: filterId },
          visibilityFilter
        ]
      },
      { $addToSet: { readBy: userIdentifier } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Notification not found or access denied' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to update notification' };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const user = await requireWriteAuth();
    await connectToDatabase();

    const visibilityFilter = buildUserVisibilityFilter(user.id, user.role);
    const userIdentifier = mongoose.Types.ObjectId.isValid(user.id)
      ? new mongoose.Types.ObjectId(user.id)
      : user.id;

    // Mark read only for the authenticated user
    await Notification.updateMany(
      {
        $and: [
          visibilityFilter,
          { readBy: { $ne: userIdentifier } }
        ]
      },
      { $addToSet: { readBy: userIdentifier } }
    );

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark all as read:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to update notifications' };
  }
}

export async function clearReadNotifications() {
  try {
    const user = await requireWriteAuth();
    await connectToDatabase();

    const visibilityFilter = buildUserVisibilityFilter(user.id, user.role);
    const userIdentifiers: any[] = [user.id];
    if (mongoose.Types.ObjectId.isValid(user.id)) {
      userIdentifiers.push(new mongoose.Types.ObjectId(user.id));
    }
    const userIdentifier = userIdentifiers[userIdentifiers.length - 1];

    // User-scoped dismissal: Adds user to dismissedBy array instead of deleting records globally.
    // This removes read notifications from the current user's view while preserving them for other users.
    await Notification.updateMany(
      {
        $and: [
          visibilityFilter,
          {
            $or: [
              { readBy: { $in: userIdentifiers } },
              { isRead: true }
            ]
          }
        ]
      },
      { $addToSet: { dismissedBy: userIdentifier } }
    );

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to clear read notifications:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to clear read notifications' };
  }
}
