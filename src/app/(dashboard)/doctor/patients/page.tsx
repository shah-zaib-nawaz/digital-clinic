import * as React from 'react';
import { ensureSession } from '@/lib/session';
import { getDoctorPatientsAction } from '@/actions/clinical.actions';
import { DoctorPatientsClient } from '@/components/doctor/doctor-patients-client';

export default async function DoctorPatientsPage() {
  await ensureSession(['doctor', 'admin', 'superadmin']);

  const res = await getDoctorPatientsAction();
  const patients = res.success && res.data ? res.data : [];

  return <DoctorPatientsClient patients={patients} />;
}
