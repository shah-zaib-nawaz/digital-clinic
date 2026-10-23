'use server';

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Notification, NotificationLean } from '@/models/Notification';
import { ensureSession } from '@/lib/session';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResult {
  notifications: NotificationLean[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
}

export async function listNotificationsAction(
  params?: ListNotificationsParams
): Promise<ActionResponse<ListNotificationsResult>> {
  try {
    const session = await ensureSession();
    await connectDB();

    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(50, Math.max(1, params?.limit || 20));
    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    const query: Record<string, any> = {
      userId: userObjectId,
      isDeleted: false,
    };

    if (params?.unreadOnly) {
      query.read = false;
    }

    const [docs, unreadCount, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<any[]>(),
      Notification.countDocuments({
        userId: userObjectId,
        read: false,
        isDeleted: false,
      }),
      Notification.countDocuments(query),
    ]);

    const mapped: NotificationLean[] = docs.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
    }));

    return {
      success: true,
      data: {
        notifications: JSON.parse(JSON.stringify(mapped)),
        unreadCount,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.error('listNotificationsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve notifications',
    };
  }
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await ensureSession();
    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const notifObjectId = new mongoose.Types.ObjectId(notificationId);

    await Notification.updateOne(
      { _id: notifObjectId, userId: userObjectId },
      { $set: { read: true } }
    );

    return {
      success: true,
      data: { id: notificationId },
    };
  } catch (error) {
    console.error('markNotificationReadAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<
  ActionResponse<{ count: number }>
> {
  try {
    const session = await ensureSession();
    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    const result = await Notification.updateMany(
      { userId: userObjectId, read: false },
      { $set: { read: true } }
    );

    return {
      success: true,
      data: { count: result.modifiedCount },
    };
  } catch (error) {
    console.error('markAllNotificationsReadAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all as read',
    };
  }
}
