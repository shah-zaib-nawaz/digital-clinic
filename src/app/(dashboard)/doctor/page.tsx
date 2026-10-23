import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import { getDoctorDailyQueueAction } from '@/actions/appointment.actions';
import { DoctorQueueClient } from '@/components/doctor/doctor-queue-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: "Today's Queue | Doctor Workspace",
  description: "Real-time daily patient consultation queue and clinical flow.",
};

export default async function DoctorDashboardPage() {
  await ensureSession(['doctor', 'admin', 'superadmin']);

  const res = await getDoctorDailyQueueAction();
  const queue = res.success && res.data ? res.data : [];

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <DoctorQueueClient initialQueue={queue} />
    </Suspense>
  );
}
