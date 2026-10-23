import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import './Patient';
import './Doctor';
import './Appointment';
import './User';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface IReview {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  rating: number; // 1 to 5
  waitDurationRating?: number; // 1 to 5
  bedsideMannerRating?: number; // 1 to 5
  comment: string;
  status: ReviewStatus;
  moderatedBy?: Types.ObjectId | null;
  moderatedAt?: Date | null;
  rejectionReason?: string | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewLean = IReview & {
  _id: Types.ObjectId;
  id: string;
};

export interface IReviewMethods {
  softDelete(): Promise<IReview>;
  restore(): Promise<IReview>;
}

export type ReviewModel = Model<IReview, {}, IReviewMethods>;

const reviewSchema = new Schema<IReview, ReviewModel, IReviewMethods>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    waitDurationRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    bedsideMannerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

reviewSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ patientId: 1, createdAt: -1 });

reviewSchema.plugin(softDeletePlugin);

export const Review: ReviewModel =
  (mongoose.models.Review as ReviewModel) ||
  model<IReview, ReviewModel>('Review', reviewSchema);
