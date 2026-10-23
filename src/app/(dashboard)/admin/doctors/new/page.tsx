import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import { getDepartmentsAction } from '@/actions/department.actions';
import { DoctorFormClient } from '@/components/admin/doctor-form-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Register Physician | Admin Command Center',
  description: 'Enroll a new physician into the clinical directory.',
};

export default async function NewDoctorPage() {
  await ensureSession(['admin', 'superadmin']);

  const deptsRes = await getDepartmentsAction(true);
  const departments = deptsRes.success && deptsRes.data ? deptsRes.data : [];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
        <DoctorFormClient departments={departments} />
      </Suspense>
    </div>
  );
}
