import { Suspense } from 'react';
import { ensureSession } from '@/lib/session';
import { getPatientAppointmentsAction } from '@/actions/appointment.actions';
import { PatientAppointmentsClient } from '@/components/patient/patient-appointments-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'My Appointments | Patient Portal',
  description: 'Manage scheduled and past medical visits at Digital Clinic.',
};

export default async function PatientAppointmentsPage() {
  await ensureSession(['patient', 'admin', 'superadmin']);

  const res = await getPatientAppointmentsAction();
  const appointments = res.success && res.data ? res.data : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <PatientAppointmentsClient initialAppointments={appointments} />
      </Suspense>
    </div>
  );
}
