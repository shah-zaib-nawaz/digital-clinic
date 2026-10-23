import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import { DepartmentLean } from './Department';
import { UserLean } from './User';

export interface IDoctor {
  userId: Types.ObjectId;
  departmentId: Types.ObjectId;
  licenseNumber: string;
  specialization: string;
  qualifications: string[];
  yearsOfExperience: number;
  consultationFee: number;
  bio: string;
  avatarUrl?: string;
  averageRating: number;
  reviewCount: number;
  isAcceptingPatients: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DoctorLean = IDoctor & {
  _id: Types.ObjectId;
  id: string;
};

export type DoctorWithDetailsLean = DoctorLean & {
  user?: UserLean;
  department?: DepartmentLean;
};

export interface IDoctorMethods {
  softDelete(): Promise<IDoctor>;
  restore(): Promise<IDoctor>;
}

export type DoctorModel = Model<IDoctor, {}, IDoctorMethods>;

const doctorSchema = new Schema<IDoctor, DoctorModel, IDoctorMethods>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAcceptingPatients: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'doctors',
  }
);

// Compound index powering public directory & department filtering
doctorSchema.index(
  { departmentId: 1, isAcceptingPatients: 1, averageRating: -1 },
  { background: true }
);

// Full-text search for AI Receptionist and patient search bar
doctorSchema.index(
  { specialization: 'text', bio: 'text' },
  { weights: { specialization: 5, bio: 1 } }
);

doctorSchema.plugin(softDeletePlugin);

export const Doctor: DoctorModel =
  (mongoose.models.Doctor as DoctorModel) ||
  model<IDoctor, DoctorModel>('Doctor', doctorSchema);
