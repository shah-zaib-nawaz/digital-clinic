import * as React from 'react';
import { ensureSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/models/Doctor';
import { Appointment } from '@/models/Appointment';
import { DoctorNotesClient } from '@/components/doctor/doctor-notes-client';

interface DoctorNotesPageProps {
  searchParams: Promise<{ appointmentId?: string }>;
}

export default async function DoctorNotesPage({ searchParams }: DoctorNotesPageProps) {
  const session = await ensureSession(['doctor', 'admin', 'superadmin']);
  const { appointmentId } = await searchParams;
  await connectDB();

  let doctorId: any;
  if ((session.user as any).role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: session.user.id });
    if (!doctor) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Doctor profile not found for this account.
        </div>
      );
    }
    doctorId = doctor._id;
  }

  const query: Record<string, any> = {
    status: { $in: ['confirmed', 'completed'] },
    isDeleted: false,
  };

  if (doctorId) {
    query.doctorId = doctorId;
  }

  const appointments = await Appointment.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone image' },
    })
    .sort({ date: -1, startTime: -1 })
    .limit(30)
    .lean<any[]>();

  return (
    <DoctorNotesClient
      appointments={JSON.parse(JSON.stringify(appointments))}
      initialAppointmentId={appointmentId}
    />
  );
}
