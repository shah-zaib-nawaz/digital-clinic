import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import { DoctorWithDetailsLean } from './Doctor';
import { PatientLean } from './Patient';
import { DepartmentLean } from './Department';

export type AppointmentStatus =
  | 'held'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface IAppointment {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  departmentId: Types.ObjectId;
  date: Date; // Normalized to 00:00:00.000Z
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  status: AppointmentStatus;
  heldUntil?: Date | null; // MongoDB TTL index field
  chiefComplaint?: string;
  attachmentUrls: string[];
  cancellationReason?: string;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  consultationFeeSnapshot: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentLean = IAppointment & {
  _id: Types.ObjectId;
  id: string;
  __v: number;
};

export type AppointmentWithDetailsLean = AppointmentLean & {
  doctor?: DoctorWithDetailsLean;
  patient?: PatientLean & { user?: { name: string; email: string; phone?: string; image?: string } };
  department?: DepartmentLean;
};

export interface IAppointmentMethods {
  softDelete(): Promise<IAppointment>;
  restore(): Promise<IAppointment>;
}

export type AppointmentModel = Model<
  IAppointment,
  {},
  IAppointmentMethods
>;

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  held: ['pending', 'confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [],
  cancelled: [],
  'no-show': [],
};

const appointmentSchema = new Schema<
  IAppointment,
  AppointmentModel,
  IAppointmentMethods
>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
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
    status: {
      type: String,
      enum: ['held', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'held',
      required: true,
      index: true,
    },
    heldUntil: {
      type: Date,
      default: null,
    },
    chiefComplaint: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    attachmentUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    consultationFeeSnapshot: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'appointments',
    optimisticConcurrency: true,
    versionKey: '__v',
  }
);

// 1. Partial Unique Index: Only 1 active appointment (held, pending, confirmed) per doctor slot
appointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['held', 'pending', 'confirmed'] },
    },
  }
);

// 2. TTL Index on heldUntil for automatic 5-min release of abandoned holds
appointmentSchema.index(
  { heldUntil: 1 },
  { expireAfterSeconds: 0 }
);

// 3. Fast retrieval of patient appointment histories
appointmentSchema.index(
  { patientId: 1, date: -1 },
  { background: true }
);

// 4. Optimized execution for doctor daily queue
appointmentSchema.index(
  { doctorId: 1, date: 1, status: 1 },
  { background: true }
);

// State transition validation hook
appointmentSchema.pre('save', async function () {
  if (!this.isNew && this.isModified('status')) {
    const previousStatus = (this as any)._originalStatus || this.get('status', null, { getters: false });
    // In Mongoose 9, direct state machine validation
    const allowed = VALID_TRANSITIONS[previousStatus as AppointmentStatus];
    if (allowed && !allowed.includes(this.status) && previousStatus !== this.status) {
      throw new Error(
        `Illegal appointment state transition from '${previousStatus}' to '${this.status}'.`
      );
    }
  }
});

appointmentSchema.plugin(softDeletePlugin);

export const Appointment: AppointmentModel =
  (mongoose.models.Appointment as AppointmentModel) ||
  model<IAppointment, AppointmentModel>('Appointment', appointmentSchema);
