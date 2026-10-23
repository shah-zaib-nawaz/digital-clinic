import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import './User';

export interface IPatient {
  userId: Types.ObjectId;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'undisclosed';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  documentUrls: string[];
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PatientLean = IPatient & {
  _id: Types.ObjectId;
  id: string;
};

export interface IPatientMethods {
  softDelete(): Promise<IPatient>;
  restore(): Promise<IPatient>;
}

export type PatientModel = Model<IPatient, {}, IPatientMethods>;

const patientSchema = new Schema<IPatient, PatientModel, IPatientMethods>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'undisclosed'],
      default: 'undisclosed',
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
    insurance: {
      provider: { type: String },
      policyNumber: { type: String },
      groupNumber: { type: String },
    },
    documentUrls: [{ type: String }],
  },
  {
    timestamps: true,
    collection: 'patient',
  }
);

patientSchema.plugin(softDeletePlugin);

export const Patient: PatientModel =
  (mongoose.models.Patient as PatientModel) || model<IPatient, PatientModel>('Patient', patientSchema);
