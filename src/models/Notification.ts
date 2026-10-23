import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'REMINDER'
  | 'VISIT_NOTE_READY'
  | 'REVIEW_APPROVED';

export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationLean = INotification & {
  _id: Types.ObjectId;
  id: string;
};

export interface INotificationMethods {
  softDelete(): Promise<INotification>;
  restore(): Promise<INotification>;
}

export type NotificationModel = Model<
  INotification,
  {},
  INotificationMethods
>;

const notificationSchema = new Schema<
  INotification,
  NotificationModel,
  INotificationMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'BOOKING_RESCHEDULED',
        'REMINDER',
        'VISIT_NOTE_READY',
        'REVIEW_APPROVED',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Compound index for instant unread badge count & chronological inbox streaming
notificationSchema.index(
  { userId: 1, read: 1, createdAt: -1 },
  { background: true }
);

notificationSchema.plugin(softDeletePlugin);

export const Notification: NotificationModel =
  (mongoose.models.Notification as NotificationModel) ||
  model<INotification, NotificationModel>('Notification', notificationSchema);
