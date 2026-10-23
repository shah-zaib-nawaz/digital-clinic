import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import { getDepartmentsAction } from '@/actions/department.actions';
import { DepartmentListClient } from '@/components/admin/department-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Clinical Departments | Admin Command Center',
  description: 'Manage clinic departments, specialties, and routing configurations.',
};

export default async function AdminDepartmentsPage() {
  await ensureSession(['admin', 'superadmin']);

  const res = await getDepartmentsAction(true);
  const departments = res.success && res.data ? res.data : [];

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <Suspense fallback={<DepartmentListSkeleton />}>
        <DepartmentListClient initialDepartments={departments} />
      </Suspense>
    </div>
  );
}

function DepartmentListSkeleton() {
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
