import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';

export type UserRole = 'patient' | 'doctor' | 'admin' | 'superadmin';

export interface IUser {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: UserRole;
  phone?: string;
  twoFactorEnabled: boolean;
  banned: boolean;
  banReason?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserLean = IUser & {
  _id: Types.ObjectId;
  id: string;
};

export interface IUserMethods {
  softDelete(): Promise<IUser>;
  restore(): Promise<IUser>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin', 'superadmin'],
      default: 'patient',
      required: true,
      index: true,
    },
    phone: { type: String, trim: true },
    twoFactorEnabled: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    banReason: { type: String },
  },
  {
    timestamps: true,
    collection: 'user', // Maps to Better Auth user collection
  }
);

userSchema.plugin(softDeletePlugin);

export const User: UserModel = (mongoose.models.User as UserModel) || model<IUser, UserModel>('User', userSchema);
