import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import { getDoctorsPaginatedAction } from '@/actions/doctor.actions';
import { getDepartmentsAction } from '@/actions/department.actions';
import { DoctorListClient } from '@/components/admin/doctor-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Medical Staff | Admin Command Center',
  description: 'Manage clinic physicians, departments, and availability schedules.',
};

export default async function AdminDoctorsPage() {
  await ensureSession(['admin', 'superadmin']);

  const [doctorsRes, deptsRes] = await Promise.all([
    getDoctorsPaginatedAction({ limit: 100 }),
    getDepartmentsAction(true),
  ]);

  const doctors = doctorsRes.success && doctorsRes.data ? doctorsRes.data.data : [];
  const departments = deptsRes.success && deptsRes.data ? deptsRes.data : [];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <Suspense fallback={<DoctorListSkeleton />}>
        <DoctorListClient initialDoctors={doctors} departments={departments} />
      </Suspense>
    </div>
  );
}

function DoctorListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
