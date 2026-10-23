import { notFound } from 'next/navigation';
import { ensureSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { Patient } from '@/models/Patient';
import { getOrCreateTelehealthSessionAction } from '@/actions/telehealth.actions';
import { PatientTelehealthRoom } from '@/components/telehealth/patient-telehealth-room';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Telehealth Consultation Room | Patient Portal',
  description: 'Connect to your private, encrypted WebRTC video consultation with your healthcare provider.',
};

export default async function PatientTelehealthPage({ params }: PageProps) {
  const session = await ensureSession(['patient', 'admin', 'superadmin']);
  const { id: appointmentId } = await params;

  await connectDB();
  const appointment = await Appointment.findById(appointmentId)
    .populate({
      path: 'doctorId',
      populate: [
        { path: 'userId', select: 'name email image' },
        { path: 'departmentId', select: 'name' },
      ],
    })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' },
    })
    .lean<any>();

  if (!appointment) {
    notFound();
  }

  // Authorize patient
  if ((session.user as any).role === 'patient') {
    const patient = await Patient.findOne({ userId: session.user.id });
    if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
      notFound();
    }
  }

  const sessionRes = await getOrCreateTelehealthSessionAction({ appointmentId });
  const telehealthSession = sessionRes.success && sessionRes.data ? sessionRes.data : null;

  return (
    <PatientTelehealthRoom
      appointment={JSON.parse(JSON.stringify(appointment))}
      telehealthSession={telehealthSession}
      patientUser={{
        id: session.user.id,
        name: session.user.name || 'Valued Patient',
      }}
    />
  );
}
