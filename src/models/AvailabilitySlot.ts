import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';

export interface IAvailabilitySlot {
  doctorId: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number; // default: 30
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AvailabilitySlotLean = IAvailabilitySlot & {
  _id: Types.ObjectId;
  id: string;
};

export interface IAvailabilitySlotMethods {
  softDelete(): Promise<IAvailabilitySlot>;
  restore(): Promise<IAvailabilitySlot>;
}

export type AvailabilitySlotModel = Model<
  IAvailabilitySlot,
  {},
  IAvailabilitySlotMethods
>;

const availabilitySlotSchema = new Schema<
  IAvailabilitySlot,
  AvailabilitySlotModel,
  IAvailabilitySlotMethods
>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    slotDurationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 10,
      max: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'availabilityslots',
  }
);

// Unique compound index: One schedule slot record per doctor per day of week
availabilitySlotSchema.index(
  { doctorId: 1, dayOfWeek: 1 },
  { unique: true }
);

availabilitySlotSchema.plugin(softDeletePlugin);

export const AvailabilitySlot: AvailabilitySlotModel =
  (mongoose.models.AvailabilitySlot as AvailabilitySlotModel) ||
  model<IAvailabilitySlot, AvailabilitySlotModel>(
    'AvailabilitySlot',
    availabilitySlotSchema
  );
