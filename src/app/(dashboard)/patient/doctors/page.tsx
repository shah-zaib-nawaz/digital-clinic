import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import {
  getCachedDoctorDirectory,
  getCachedDepartments,
} from '@/lib/queries/doctor-directory';
import { DoctorDirectoryClient } from '@/components/doctors/doctor-directory-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Find Doctors | Patient Portal',
  description: 'Search clinic physicians, view specialties, and schedule your appointment.',
};

export default async function PatientDoctorsDirectoryPage() {
  await ensureSession(['patient', 'admin', 'superadmin']);

  const [doctors, departments] = await Promise.all([
    getCachedDoctorDirectory(),
    getCachedDepartments(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Find a Physician
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse certified doctors by clinical specialty, rating, and real-time appointment availability.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <DoctorDirectoryClient
          initialDoctors={doctors}
          departments={departments}
          baseBookingPath="/patient/book"
        />
      </Suspense>
    </div>
  );
}
