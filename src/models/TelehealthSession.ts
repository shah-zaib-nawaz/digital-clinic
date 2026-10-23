import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import './Patient';
import './Doctor';
import './Appointment';

export type TelehealthSessionStatus =
  | 'waiting'
  | 'in-progress'
  | 'concluded'
  | 'abandoned';

export type TelehealthConnectionQuality =
  | 'excellent'
  | 'good'
  | 'poor'
  | 'unknown';

export interface ITelehealthSession {
  appointmentId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  roomName: string;
  status: TelehealthSessionStatus;
  startedAt?: Date | null;
  endedAt?: Date | null;
  durationSeconds: number;
  doctorJoined: boolean;
  patientJoined: boolean;
  recordingConsent: boolean;
  connectionQuality: TelehealthConnectionQuality;
  notesSummary?: string;
  sdpOffer?: any;
  sdpAnswer?: any;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TelehealthSessionLean = ITelehealthSession & {
  _id: Types.ObjectId;
  id: string;
};

export interface ITelehealthSessionMethods {
  softDelete(): Promise<ITelehealthSession>;
  restore(): Promise<ITelehealthSession>;
}

export type TelehealthSessionModel = Model<
  ITelehealthSession,
  {},
  ITelehealthSessionMethods
>;

const telehealthSessionSchema = new Schema<
  ITelehealthSession,
  TelehealthSessionModel,
  ITelehealthSessionMethods
>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'concluded', 'abandoned'],
      default: 'waiting',
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    doctorJoined: {
      type: Boolean,
      default: false,
    },
    patientJoined: {
      type: Boolean,
      default: false,
    },
    recordingConsent: {
      type: Boolean,
      default: false,
    },
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'poor', 'unknown'],
      default: 'unknown',
    },
    notesSummary: {
      type: String,
      trim: true,
    },
    sdpOffer: {
      type: Schema.Types.Mixed,
      default: null,
    },
    sdpAnswer: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'telehealth_sessions',
  }
);

telehealthSessionSchema.index({ doctorId: 1, status: 1 });
telehealthSessionSchema.index({ patientId: 1, status: 1 });

telehealthSessionSchema.plugin(softDeletePlugin);

export const TelehealthSession: TelehealthSessionModel =
  (mongoose.models.TelehealthSession as TelehealthSessionModel) ||
  model<ITelehealthSession, TelehealthSessionModel>(
    'TelehealthSession',
    telehealthSessionSchema
  );
