'use server';

import { after } from 'next/server';
import { updateTag, revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Review, ReviewLean, ReviewStatus } from '@/models/Review';
import { Appointment } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { User } from '@/models/User';
import { ensureSession } from '@/lib/session';
import { createAndBroadcastNotification } from '@/lib/notification-bus';
import {
  createReviewSchemaCompiled,
  moderateReviewSchemaCompiled,
} from '@/lib/validations/review';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function recalculateDoctorRating(
  doctorId: string | mongoose.Types.ObjectId
): Promise<{ averageRating: number; reviewCount: number }> {
  await connectDB();
  const docId = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;

  const stats = await Review.aggregate([
    {
      $match: {
        doctorId: docId,
        status: 'approved',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const reviewCount = stats.length > 0 ? stats[0].count : 0;

  await Doctor.findByIdAndUpdate(docId, {
    averageRating,
    reviewCount,
  });

  return { averageRating, reviewCount };
}

export async function createReviewAction(
  input: unknown
): Promise<ActionResponse<ReviewLean>> {
  try {
    const session = await ensureSession(['patient', 'admin', 'superadmin']);
    const parseResult = createReviewSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, rating, waitDurationRating, bedsideMannerRating, comment } =
      parseResult.data;

    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment encounter not found' };
    }

    if (appointment.status !== 'completed') {
      return {
        success: false,
        error: 'You can only submit reviews for concluded, completed visits',
      };
    }

    // Role check: patient must own appointment
    if ((session.user as any).role === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return { success: false, error: 'Unauthorized to review this appointment' };
      }
    }

    // Check if review already exists
    const existing = await Review.findOne({ appointmentId: appointment._id });
    if (existing) {
      return {
        success: false,
        error: 'A review has already been submitted for this consultation',
      };
    }

    const review = await Review.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      rating,
      waitDurationRating,
      bedsideMannerRating,
      comment,
      status: 'pending',
    });

    const doctorIdStr = appointment.doctorId.toString();

    // Asynchronously notify administrators of review awaiting moderation
    after(async () => {
      try {
        await connectDB();
        const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id');
        for (const admin of admins) {
          await createAndBroadcastNotification({
            userId: admin._id.toString(),
            type: 'REVIEW_PENDING',
            title: 'New Patient Review Pending Moderation',
            message: `A new ${rating}-star consultation review has been submitted and is awaiting approval.`,
            actionUrl: '/admin/reviews',
          });
        }
      } catch (err) {
        console.error('after(createReviewAction) error:', err);
      }
    });

    revalidatePath('/patient/appointments');
    revalidatePath(`/doctors/${doctorIdStr}`);
    revalidatePath('/admin/reviews');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(review.toObject())),
    };
  } catch (error) {
    console.error('createReviewAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit review',
    };
  }
}

export async function moderateReviewAction(
  input: unknown
): Promise<ActionResponse<{ status: ReviewStatus; averageRating: number; reviewCount: number }>> {
  try {
    const session = await ensureSession(['admin', 'superadmin']);
    const parseResult = moderateReviewSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { reviewId, status, rejectionReason } = parseResult.data;
    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    review.status = status;
    review.moderatedBy = new mongoose.Types.ObjectId(session.user.id);
    review.moderatedAt = new Date();
    if (rejectionReason) {
      review.rejectionReason = rejectionReason;
    }
    await review.save();

    // Recalculate doctor rating dynamically
    const stats = await recalculateDoctorRating(review.doctorId);

    const doctorIdStr = review.doctorId.toString();
    const approvedRating = review.rating;

    // Asynchronously notify doctor if approved
    if (status === 'approved') {
      after(async () => {
        try {
          await connectDB();
          const doctor = await Doctor.findById(doctorIdStr).populate('userId', 'name');
          const doctorUserId = (doctor as any)?.userId?._id?.toString();
          if (doctorUserId) {
            await createAndBroadcastNotification({
              userId: doctorUserId,
              type: 'REVIEW_APPROVED',
              title: 'New Patient Review Published',
              message: `A patient left you a verified ${approvedRating}-star review. Your aggregate rating is now ${stats.averageRating} ★.`,
              actionUrl: '/doctor/reviews',
            });
          }
        } catch (err) {
          console.error('after(moderateReviewAction) error:', err);
        }
      });
    }

    updateTag('doctor-list');
    revalidatePath('/admin/reviews');
    revalidatePath('/doctor/reviews');
    revalidatePath(`/doctors/${doctorIdStr}`);

    return {
      success: true,
      data: {
        status,
        averageRating: stats.averageRating,
        reviewCount: stats.reviewCount,
      },
    };
  } catch (error) {
    console.error('moderateReviewAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to moderate review',
    };
  }
}

export interface DoctorReviewsResult {
  reviews: any[];
  stats: {
    averageRating: number;
    reviewCount: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

export async function getDoctorReviewsAction(
  doctorId: string,
  includePending = false
): Promise<ActionResponse<DoctorReviewsResult>> {
  try {
    await connectDB();
    const query: Record<string, any> = {
      doctorId: new mongoose.Types.ObjectId(doctorId),
      isDeleted: false,
    };

    if (!includePending) {
      query.status = 'approved';
    }

    const reviews = await Review.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name image' },
      })
      .sort({ createdAt: -1 })
      .lean<any[]>();

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let approvedCount = 0;

    for (const r of reviews) {
      if (r.status === 'approved') {
        const rating = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        distribution[rating] = (distribution[rating] || 0) + 1;
        sum += r.rating;
        approvedCount++;
      }
    }

    const averageRating = approvedCount > 0 ? Math.round((sum / approvedCount) * 10) / 10 : 0;

    return {
      success: true,
      data: {
        reviews: JSON.parse(JSON.stringify(reviews.map((r) => ({ ...r, id: r._id.toString() })))),
        stats: {
          averageRating,
          reviewCount: approvedCount,
          distribution,
        },
      },
    };
  } catch (error) {
    console.error('getDoctorReviewsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve doctor reviews',
    };
  }
}

export async function getAdminReviewsQueueAction(
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all'
): Promise<ActionResponse<any[]>> {
  try {
    await ensureSession(['admin', 'superadmin']);
    await connectDB();

    const query: Record<string, any> = { isDeleted: false };
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    const reviews = await Review.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email image' },
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email image' },
          { path: 'departmentId', select: 'name' },
        ],
      })
      .populate('moderatedBy', 'name')
      .sort({ createdAt: -1 })
      .lean<any[]>();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(reviews.map((r) => ({ ...r, id: r._id.toString() })))),
    };
  } catch (error) {
    console.error('getAdminReviewsQueueAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve review queue',
    };
  }
}

export async function getAppointmentReviewAction(
  appointmentId: string
): Promise<ActionResponse<ReviewLean | null>> {
  try {
    await connectDB();
    const review = await Review.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      isDeleted: false,
    }).lean<any>();

    if (!review) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify({ ...review, id: review._id.toString() })),
    };
  } catch (error) {
    console.error('getAppointmentReviewAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check appointment review',
    };
  }
}
