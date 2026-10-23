import { redirect } from 'next/navigation';
import { ensureSession } from '@/lib/session';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorAppointmentNotesRedirect({ params }: PageProps) {
  await ensureSession(['doctor', 'admin', 'superadmin']);
  const { id } = await params;
  redirect(`/doctor/notes?appointmentId=${id}`);
}
