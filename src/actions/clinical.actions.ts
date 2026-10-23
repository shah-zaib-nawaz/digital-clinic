'use server';

import { after } from 'next/server';
import { updateTag, revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { VisitNote, VisitNoteLean } from '@/models/VisitNote';
import { Prescription, PrescriptionLean } from '@/models/Prescription';
import { Appointment } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { Patient, PatientLean } from '@/models/Patient';
import { ensureSession } from '@/lib/session';
import { createAndBroadcastNotification } from '@/lib/notification-bus';
import {
  saveVisitNoteSchemaCompiled,
  createPrescriptionSchemaCompiled,
} from '@/lib/validations/clinical';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function saveVisitNoteAction(
  input: unknown
): Promise<ActionResponse<VisitNoteLean>> {
  try {
    const session = await ensureSession(['doctor', 'admin', 'superadmin']);
    const parseResult = saveVisitNoteSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, soap, vitals, icd10Codes, status } = parseResult.data;
    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    // Role verification for doctor
    if ((session.user as any).role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return { success: false, error: 'Unauthorized to document note for this appointment' };
      }
    }

    let note = await VisitNote.findOne({ appointmentId: appointment._id });

    if (note) {
      // If already finalized, only superadmin or amending allowed
      if (note.status === 'finalized' && status === 'draft') {
        return { success: false, error: 'Cannot revert a finalized clinical note to draft' };
      }

      note.soap = soap;
      if (vitals) note.vitals = vitals;
      note.icd10Codes = icd10Codes || [];
      note.status = status;

      if (status === 'finalized' && !note.finalizedAt) {
        note.finalizedAt = new Date();
      }
      await note.save();
    } else {
      note = await VisitNote.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        soap,
        vitals,
        icd10Codes: icd10Codes || [],
        status,
        finalizedAt: status === 'finalized' ? new Date() : null,
      });
    }

    // If finalizing note, complete the appointment and notify patient asynchronously
    if (status === 'finalized') {
      appointment.status = 'completed';
      await appointment.save();

      const patientIdStr = appointment.patientId.toString();
      const doctorIdStr = appointment.doctorId.toString();

      after(async () => {
        try {
          await connectDB();
          const patient = await Patient.findById(patientIdStr).populate('userId', 'name email');
          const doctor = await Doctor.findById(doctorIdStr).populate('userId', 'name');

          const patientUser = (patient as any)?.userId;
          const doctorUser = (doctor as any)?.userId;

          if (patientUser?._id) {
            await createAndBroadcastNotification({
              userId: patientUser._id.toString(),
              type: 'VISIT_NOTE_READY',
              title: 'Clinical Care Plan Ready',
              message: `Dr. ${doctorUser?.name || 'Physician'} has finalized your consultation notes and clinical recommendations.`,
              actionUrl: '/patient/records',
            });
          }
        } catch (err) {
          console.error('after(saveVisitNoteAction) notification error:', err);
        }
      });
    }

    updateTag('patient-appointments');
    revalidatePath('/doctor');
    revalidatePath('/doctor/notes');
    revalidatePath('/patient/records');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(note.toObject())),
    };
  } catch (error) {
    console.error('saveVisitNoteAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save visit note',
    };
  }
}

export async function getVisitNoteByAppointmentAction(
  appointmentId: string
): Promise<ActionResponse<VisitNoteLean | null>> {
  try {
    const session = await ensureSession(['doctor', 'patient', 'admin', 'superadmin']);
    await connectDB();

    const note = await VisitNote.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      isDeleted: false,
    }).lean<any>();

    if (!note) {
      return { success: true, data: null };
    }

    // Role boundary checks
    const userRole = (session.user as any).role;
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient || note.patientId.toString() !== patient._id.toString()) {
        return { success: false, error: 'Unauthorized to view this clinical note' };
      }
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify({ ...note, id: note._id.toString() })),
    };
  } catch (error) {
    console.error('getVisitNoteByAppointmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch visit note',
    };
  }
}

export async function createPrescriptionAction(
  input: unknown
): Promise<ActionResponse<PrescriptionLean>> {
  try {
    const session = await ensureSession(['doctor', 'admin', 'superadmin']);
    const parseResult = createPrescriptionSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, visitNoteId, medications, notes } = parseResult.data;
    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    if ((session.user as any).role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return { success: false, error: 'Unauthorized to issue prescriptions for this appointment' };
      }
    }

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      visitNoteId: visitNoteId ? new mongoose.Types.ObjectId(visitNoteId) : null,
      medications,
      notes,
      issuedAt: new Date(),
    });

    const patientIdStr = appointment.patientId.toString();
    const doctorIdStr = appointment.doctorId.toString();
    const medCount = medications.length;

    after(async () => {
      try {
        await connectDB();
        const patient = await Patient.findById(patientIdStr).populate('userId', 'name');
        const doctor = await Doctor.findById(doctorIdStr).populate('userId', 'name');

        const patientUser = (patient as any)?.userId;
        const doctorUser = (doctor as any)?.userId;

        if (patientUser?._id) {
          await createAndBroadcastNotification({
            userId: patientUser._id.toString(),
            type: 'VISIT_NOTE_READY',
            title: 'Digital Prescription Issued',
            message: `Dr. ${doctorUser?.name || 'Physician'} issued a prescription with ${medCount} medication${medCount > 1 ? 's' : ''}.`,
            actionUrl: '/patient/records',
          });
        }
      } catch (err) {
        console.error('after(createPrescriptionAction) notification error:', err);
      }
    });

    revalidatePath('/doctor/notes');
    revalidatePath('/patient/records');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(prescription.toObject())),
    };
  } catch (error) {
    console.error('createPrescriptionAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create prescription',
    };
  }
}

export interface PatientMedicalRecordsResult {
  patient: PatientLean | null;
  appointments: any[];
  notes: VisitNoteLean[];
  prescriptions: PrescriptionLean[];
}

export async function getPatientMedicalRecordsAction(
  targetPatientId?: string
): Promise<ActionResponse<PatientMedicalRecordsResult>> {
  try {
    const session = await ensureSession(['patient', 'doctor', 'admin', 'superadmin']);
    await connectDB();

    let resolvedPatientId: mongoose.Types.ObjectId;
    const userRole = (session.user as any).role;

    if (userRole === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient) {
        return {
          success: true,
          data: { patient: null, appointments: [], notes: [], prescriptions: [] },
        };
      }
      resolvedPatientId = patient._id as mongoose.Types.ObjectId;
    } else {
      if (!targetPatientId) {
        return { success: false, error: 'Patient ID is required for clinician review' };
      }
      resolvedPatientId = new mongoose.Types.ObjectId(targetPatientId);
    }

    const [patientDoc, appointments, notes, prescriptions] = await Promise.all([
      Patient.findById(resolvedPatientId).populate('userId', 'name email image phone').lean<any>(),
      Appointment.find({ patientId: resolvedPatientId, status: { $in: ['confirmed', 'completed'] } })
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email image' },
            { path: 'departmentId', select: 'name slug iconName' },
          ],
        })
        .sort({ date: -1, startTime: -1 })
        .lean<any[]>(),
      VisitNote.find({ patientId: resolvedPatientId, status: 'finalized', isDeleted: false })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email' },
        })
        .sort({ createdAt: -1 })
        .lean<any[]>(),
      Prescription.find({ patientId: resolvedPatientId, isDeleted: false })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email' },
        })
        .sort({ issuedAt: -1 })
        .lean<any[]>(),
    ]);

    return {
      success: true,
      data: {
        patient: patientDoc ? JSON.parse(JSON.stringify({ ...patientDoc, id: patientDoc._id.toString() })) : null,
        appointments: JSON.parse(JSON.stringify(appointments)),
        notes: JSON.parse(JSON.stringify(notes)),
        prescriptions: JSON.parse(JSON.stringify(prescriptions)),
      },
    };
  } catch (error) {
    console.error('getPatientMedicalRecordsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve medical records',
    };
  }
}

export async function getDoctorPatientsAction(): Promise<ActionResponse<any[]>> {
  try {
    const session = await ensureSession(['doctor', 'admin', 'superadmin']);
    await connectDB();

    const doctor = await Doctor.findOne({ userId: session.user.id });
    if (!doctor) {
      return { success: true, data: [] };
    }

    // Find all distinct patients who booked with this doctor
    const patientIds = await Appointment.find({
      doctorId: doctor._id,
      status: { $in: ['confirmed', 'completed'] },
    }).distinct('patientId');

    const patients = await Patient.find({ _id: { $in: patientIds } })
      .populate('userId', 'name email phone image')
      .lean<any[]>();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(patients.map((p) => ({ ...p, id: p._id.toString() })))),
    };
  } catch (error) {
    console.error('getDoctorPatientsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve doctor patients',
    };
  }
}
