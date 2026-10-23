import * as React from 'react';
import { ensureSession } from '@/lib/session';
import { getPatientMedicalRecordsAction } from '@/actions/clinical.actions';
import { PatientRecordsClient } from '@/components/patient/patient-records-client';

export default async function PatientRecordsPage() {
  await ensureSession(['patient', 'admin', 'superadmin']);

  const res = await getPatientMedicalRecordsAction();
  const data = res.success && res.data ? res.data : {
    patient: null,
    appointments: [],
    notes: [],
    prescriptions: [],
  };

  return <PatientRecordsClient data={data} />;
}
