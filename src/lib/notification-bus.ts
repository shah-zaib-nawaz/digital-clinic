import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Notification, NotificationLean, NotificationType } from '@/models/Notification';

declare global {
  var _clinicNotificationBus: EventEmitter | undefined;
}

export const notificationBus: EventEmitter =
  globalThis._clinicNotificationBus || new EventEmitter();

if (!globalThis._clinicNotificationBus) {
  notificationBus.setMaxListeners(200);
  globalThis._clinicNotificationBus = notificationBus;
}

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

export async function createAndBroadcastNotification(
  params: CreateNotificationParams
): Promise<NotificationLean> {
  await connectDB();

  const userObjectId =
    typeof params.userId === 'string'
      ? new mongoose.Types.ObjectId(params.userId)
      : params.userId;

  const doc = await Notification.create({
    userId: userObjectId,
    type: params.type,
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
    read: false,
  });

  const leanNotification: NotificationLean = {
    ...doc.toObject(),
    id: doc._id.toString(),
  };

  // Broadcast to all active SSE listener streams for this user
  notificationBus.emit(`notification:${userObjectId.toString()}`, leanNotification);
  notificationBus.emit('notification:any', leanNotification);

  return JSON.parse(JSON.stringify(leanNotification));
}
