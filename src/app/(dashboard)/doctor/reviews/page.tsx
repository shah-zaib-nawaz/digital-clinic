import * as React from 'react';
import { ensureSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { getDoctorReviewsAction } from '@/actions/review.actions';
import { DoctorReviewsClient } from '@/components/doctor/doctor-reviews-client';

export const metadata = {
  title: 'Reviews & Reputation | Doctor Workspace',
  description: 'Inspect patient feedback, star rating distribution, and clinical bedside manner metrics.',
};

export default async function DoctorReviewsPage() {
  const session = await ensureSession(['doctor', 'admin', 'superadmin']);
  await connectDB();

  let doctorId: string | null = null;
  if ((session.user as any).role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: session.user.id });
    if (!doctor) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Doctor profile not found for this account.
        </div>
      );
    }
    doctorId = doctor._id.toString();
  } else {
    // Admin reviewing first doctor
    const doctor = await Doctor.findOne();
    if (doctor) doctorId = doctor._id.toString();
  }

  if (!doctorId) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No doctor profile available.
      </div>
    );
  }

  const res = await getDoctorReviewsAction(doctorId, true);
  const data = res.success && res.data ? res.data : {
    reviews: [],
    stats: {
      averageRating: 0,
      reviewCount: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
  };

  return <DoctorReviewsClient data={data} />;
}
