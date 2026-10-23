import * as React from 'react';
import { ensureSession } from '@/lib/session';
import { getAdminReviewsQueueAction } from '@/actions/review.actions';
import { ReviewModerationClient } from '@/components/admin/review-moderation-client';

export const metadata = {
  title: 'Patient Reviews Moderation | Admin Mission Control',
  description: 'Moderate patient consultation reviews, protect clinical reputation, and ensure HIPAA compliance.',
};

export default async function AdminReviewsPage() {
  await ensureSession(['admin', 'superadmin']);

  const res = await getAdminReviewsQueueAction('all');
  const reviews = res.success && res.data ? res.data : [];

  return <ReviewModerationClient initialReviews={reviews} />;
}
