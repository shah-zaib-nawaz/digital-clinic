import { z } from 'zod';

export const createReviewSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  waitDurationRating: z.number().int().min(1).max(5).optional(),
  bedsideMannerRating: z.number().int().min(1).max(5).optional(),
  comment: z
    .string()
    .min(5, 'Review comment must be at least 5 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters'),
});

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
});

export const createReviewSchemaCompiled = z.compile(createReviewSchema);
export const moderateReviewSchemaCompiled = z.compile(moderateReviewSchema);

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
