import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import { getCachedDoctorDirectory, getCachedDepartments } from '@/lib/queries/doctor-directory';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { Skeleton } from '@/components/ui/skeleton';

interface PatientBookPageProps {
  searchParams: Promise<{ doctorId?: string }>;
}

export const metadata = {
  title: 'Book Consultation | Patient Portal',
  description: 'Schedule a medical consultation with a board-certified physician with real-time slot reservation.',
};

export default async function PatientBookPage({ searchParams }: PatientBookPageProps) {
  await ensureSession(['patient', 'admin', 'superadmin']);
  const { doctorId } = await searchParams;

  const [doctors, departments] = await Promise.all([
    getCachedDoctorDirectory({ acceptingOnly: true }),
    getCachedDepartments(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Book an Appointment
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select a physician, pick a convenient consultation slot, and receive immediate booking confirmation.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
        <BookingWizard
          doctors={doctors}
          departments={departments}
          preselectedDoctorId={doctorId}
        />
      </Suspense>
    </div>
  );
}
