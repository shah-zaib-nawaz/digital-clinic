import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';

export interface IDepartment {
  name: string;
  slug: string;
  description: string;
  iconName: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DepartmentLean = IDepartment & {
  _id: Types.ObjectId;
  id: string;
};

export interface IDepartmentMethods {
  softDelete(): Promise<IDepartment>;
  restore(): Promise<IDepartment>;
}

export type DepartmentModel = Model<IDepartment, {}, IDepartmentMethods>;

const departmentSchema = new Schema<IDepartment, DepartmentModel, IDepartmentMethods>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    iconName: {
      type: String,
      required: true,
      default: 'Activity',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'departments',
  }
);

departmentSchema.plugin(softDeletePlugin);

export const Department: DepartmentModel =
  (mongoose.models.Department as DepartmentModel) ||
  model<IDepartment, DepartmentModel>('Department', departmentSchema);
