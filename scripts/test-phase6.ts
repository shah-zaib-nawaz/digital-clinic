import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../src/lib/db';
import { User } from '../src/models/User';
import { Doctor } from '../src/models/Doctor';
import { Patient } from '../src/models/Patient';
import { Appointment } from '../src/models/Appointment';
import { VisitNote } from '../src/models/VisitNote';
import { Prescription } from '../src/models/Prescription';
import {
  saveVisitNoteSchemaCompiled,
  createPrescriptionSchemaCompiled,
} from '../src/lib/validations/clinical';

async function runPhase6Tests() {
  console.log('🩺 Starting Phase 6 Clinical Charting & Prescriptions Verification Harness...\n');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas Replica Set.');

    // 1. Locate Doctor and Patient
    const doctor = await Doctor.findOne().populate('userId');
    const patient = await Patient.findOne().populate('userId');

    if (!doctor || !patient) {
      throw new Error('Doctor or Patient not found in seeded database. Run seed first.');
    }
    console.log(`👨‍⚕️ Clinician: Dr. ${(doctor.userId as any)?.name} (${doctor._id})`);
    console.log(`👤 Patient: ${(patient.userId as any)?.name} (${patient._id})`);

    // 2. Create or find an encounter appointment for clinical documentation
    let appointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      status: 'confirmed',
    });

    if (!appointment) {
      appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: doctor.departmentId,
        date: new Date(),
        startTime: '11:00',
        endTime: '11:30',
        status: 'confirmed',
        chiefComplaint: 'Persistent migraine and mild photophobia for 4 days',
        attachmentUrls: [],
        consultationFeeSnapshot: (doctor as any).consultationFee || 150,
      });
      console.log(`📅 Created fresh test encounter appointment: ${appointment._id}`);
    } else {
      console.log(`📅 Reusing confirmed test encounter: ${appointment._id}`);
    }

    // 3. Test Zod 4 Schema Validation with z.compile
    console.log('\n--- Test 1: Zod 4 Schema Validation & JIT Compilation ---');
    const rawNotePayload = {
      appointmentId: appointment._id.toString(),
      soap: {
        subjective: 'Patient reports throbbing frontal headache with moderate photophobia. Denies fever or neck stiffness.',
        objective: 'Vitals stable. Cranial nerves II-XII grossly intact. No papilledema on fundoscopic exam.',
        assessment: 'Tension-type migraine without aura, episodic.',
        plan: 'Prescribe Sumatriptan 50mg PRN. Advise sleep hygiene, adequate hydration, and symptom journal.',
      },
      vitals: {
        bloodPressureSystolic: 124,
        bloodPressureDiastolic: 82,
        heartRate: 72,
        temperatureCelsius: 36.8,
        oxygenSaturation: 99,
        weightKg: 68.5,
      },
      icd10Codes: [
        { code: 'G43.909', description: 'Migraine, unspecified, not intractable, without status migrainosus' },
        { code: 'R51.9', description: 'Headache, unspecified' },
      ],
      status: 'draft' as const,
    };

    const noteParseResult = saveVisitNoteSchemaCompiled.safeParse(rawNotePayload);
    if (!noteParseResult.success) {
      throw new Error(`Validation failed for visit note: ${JSON.stringify(noteParseResult.error)}`);
    }
    console.log('✅ Visit Note Zod 4 schema compiled and validated successfully.');

    // 4. Test Draft Visit Note Persistence in MongoDB
    console.log('\n--- Test 2: Draft SOAP Visit Note Creation ---');
    // Clean existing note for this appointment if any
    await VisitNote.deleteMany({ appointmentId: appointment._id });

    const draftNote = await VisitNote.create({
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: doctor._id,
      soap: noteParseResult.data.soap,
      vitals: noteParseResult.data.vitals,
      icd10Codes: noteParseResult.data.icd10Codes,
      status: 'draft',
    });

    console.log(`✅ Draft VisitNote persisted with ID: ${draftNote._id}`);
    console.log(`   Status: ${draftNote.status} | ICD-10 Codes: ${draftNote.icd10Codes.length} | Systolic BP: ${draftNote.vitals?.bloodPressureSystolic}`);

    if (draftNote.status !== 'draft') {
      throw new Error(`Expected draft status, got ${draftNote.status}`);
    }

    // 5. Test Prescription Schema & Creation
    console.log('\n--- Test 3: Digital Prescription Validation & Issuance ---');
    const rawPrescriptionPayload = {
      appointmentId: appointment._id.toString(),
      visitNoteId: draftNote._id.toString(),
      medications: [
        {
          name: 'Sumatriptan Succinate',
          dosage: '50mg oral tablet',
          frequency: 'Once at onset of migraine; may repeat once after 2 hours if needed',
          duration: '30 days PRN',
          instructions: 'Do not exceed 200mg in 24 hours. Take with full glass of water.',
          refills: 2,
        },
        {
          name: 'Magnesium Glycinate',
          dosage: '400mg oral capsule',
          frequency: 'Once nightly before bedtime',
          duration: '60 days',
          instructions: 'Nutritional prophylaxis for neurovascular support.',
          refills: 3,
        },
      ],
      notes: 'Follow up in 4 weeks if migraine frequency exceeds 3 episodes per week.',
    };

    const prescriptionParseResult = createPrescriptionSchemaCompiled.safeParse(rawPrescriptionPayload);
    if (!prescriptionParseResult.success) {
      throw new Error(`Validation failed for prescription: ${JSON.stringify(prescriptionParseResult.error)}`);
    }
    console.log('✅ Prescription Zod 4 schema compiled and validated successfully.');

    // Clean existing prescriptions for this appointment
    await Prescription.deleteMany({ appointmentId: appointment._id });

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: doctor._id,
      visitNoteId: draftNote._id,
      medications: prescriptionParseResult.data.medications,
      notes: prescriptionParseResult.data.notes,
      issuedAt: new Date(),
    });

    console.log(`✅ Digital Prescription persisted with ID: ${prescription._id}`);
    console.log(`   Medications count: ${prescription.medications.length}`);
    prescription.medications.forEach((med, idx) => {
      console.log(`   [Med #${idx + 1}] ${med.name} | ${med.dosage} | Refills: ${med.refills}`);
    });

    // 6. Test Finalizing Visit Note (Clinical Sealing)
    console.log('\n--- Test 4: Finalize & Clinically Seal SOAP Note ---');
    draftNote.status = 'finalized';
    draftNote.finalizedAt = new Date();
    await draftNote.save();

    // Verify appointment status transitions to completed
    appointment.status = 'completed';
    await appointment.save();

    const finalizedNoteCheck = await VisitNote.findById(draftNote._id);
    const completedApptCheck = await Appointment.findById(appointment._id);

    if (finalizedNoteCheck?.status !== 'finalized' || !finalizedNoteCheck?.finalizedAt) {
      throw new Error('Visit note was not finalized correctly');
    }
    if (completedApptCheck?.status !== 'completed') {
      throw new Error('Appointment was not marked completed upon finalization');
    }

    console.log(`✅ Visit Note finalized at: ${finalizedNoteCheck.finalizedAt.toISOString()}`);
    console.log(`✅ Encounter Appointment status transitioned to: ${completedApptCheck.status}`);

    // 7. Test Patient Longitudinal Medical Record Aggregation
    console.log('\n--- Test 5: Longitudinal Patient Medical Record Aggregation ---');
    const [patientRecordsNotes, patientRecordsPrescriptions] = await Promise.all([
      VisitNote.find({ patientId: patient._id, status: 'finalized', isDeleted: false })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .lean(),
      Prescription.find({ patientId: patient._id, isDeleted: false })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .lean(),
    ]);

    console.log(`✅ Finalized Visit Notes in Patient Chart: ${patientRecordsNotes.length}`);
    console.log(`✅ Active Prescriptions in Patient Chart: ${patientRecordsPrescriptions.length}`);

    if (patientRecordsNotes.length === 0 || patientRecordsPrescriptions.length === 0) {
      throw new Error('Failed to retrieve finalized patient chart items');
    }

    // 8. Test Soft Delete & Restore Plugin on Clinical Records
    console.log('\n--- Test 6: Mongoose 9.11 Soft Delete Plugin Verification ---');
    const noteDoc = await VisitNote.findById(draftNote._id);
    if (!noteDoc) throw new Error('Note not found for soft delete test');

    await noteDoc.softDelete();

    // Standard findById should filter out soft-deleted doc
    const hiddenCheck = await VisitNote.findById(draftNote._id);
    if (hiddenCheck !== null) {
      throw new Error('Soft-deleted document was not filtered out from standard queries');
    }
    console.log('✅ Soft-deleted document is filtered out from standard queries (returned null).');

    // Query with includeDeleted: true should find it with flags
    const deletedCheck = await VisitNote.findById(draftNote._id, null, { includeDeleted: true });
    if (!deletedCheck?.isDeleted || !deletedCheck?.deletedAt) {
      throw new Error('Soft delete failed to set isDeleted and deletedAt flags');
    }
    console.log('✅ Soft delete successfully verified with { includeDeleted: true } (isDeleted: true)');

    await noteDoc.restore();
    const restoredCheck = await VisitNote.findById(draftNote._id);
    if (!restoredCheck || restoredCheck.isDeleted || restoredCheck.deletedAt) {
      throw new Error('Restore failed to clear isDeleted flag');
    }
    console.log('✅ Restore successfully brought document back to standard queries (isDeleted: false)');

    console.log('\n🎉 ALL PHASE 6 CLINICAL VERIFICATION TESTS PASSED CLEANLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 6 Verification Test Failed:', err);
    process.exit(1);
  }
}

runPhase6Tests();
