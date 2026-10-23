import { notFound } from 'next/navigation';
import { ensureSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { getOrCreateTelehealthSessionAction } from '@/actions/telehealth.actions';
import { DoctorTelehealthCockpit } from '@/components/telehealth/doctor-telehealth-cockpit';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Telehealth Consultation Cockpit | Doctor Workspace',
  description: 'Encrypted WebRTC video consultation room with live clinical charting and patient vitals inspection.',
};

export default async function DoctorTelehealthPage({ params }: PageProps) {
  const session = await ensureSession(['doctor', 'admin', 'superadmin']);
  const { id: appointmentId } = await params;

  await connectDB();
  const appointment = await Appointment.findById(appointmentId)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone image' },
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email image' },
    })
    .lean<any>();

  if (!appointment) {
    notFound();
  }

  // Authorize doctor
  if ((session.user as any).role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: session.user.id });
    if (!doctor || appointment.doctorId._id.toString() !== doctor._id.toString()) {
      notFound();
    }
  }

  // Initialize or fetch session
  const sessionRes = await getOrCreateTelehealthSessionAction({ appointmentId });
  const telehealthSession = sessionRes.success && sessionRes.data ? sessionRes.data : null;

  return (
    <DoctorTelehealthCockpit
      appointment={JSON.parse(JSON.stringify(appointment))}
      telehealthSession={telehealthSession}
      doctorUser={{
        id: session.user.id,
        name: session.user.name || 'Physician',
      }}
    />
  );
}
