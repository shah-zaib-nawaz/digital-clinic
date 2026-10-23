'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import {
  TelehealthSession,
  TelehealthSessionLean,
  TelehealthSessionStatus,
} from '@/models/TelehealthSession';
import { Appointment } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { ensureSession } from '@/lib/session';
import { emitTelehealthSignal } from '@/lib/telehealth/signaling-bus';
import {
  concludeSessionSchemaCompiled,
  joinSessionSchemaCompiled,
} from '@/lib/validations/telehealth';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function getOrCreateTelehealthSessionAction(
  input: unknown
): Promise<ActionResponse<TelehealthSessionLean>> {
  try {
    const session = await ensureSession(['doctor', 'patient', 'admin', 'superadmin']);
    const parseResult = joinSessionSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId } = parseResult.data;
    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    const userRole = (session.user as any).role;
    let isDoctor = false;
    let isPatient = false;

    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return { success: false, error: 'Unauthorized to enter this telehealth room' };
      }
      isDoctor = true;
    } else if (userRole === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return { success: false, error: 'Unauthorized to enter this telehealth room' };
      }
      isPatient = true;
    } else {
      // Admin/superadmin inspection
      isDoctor = true;
    }

    let telehealthDoc = await TelehealthSession.findOne({
      appointmentId: appointment._id,
      isDeleted: false,
    });

    const now = new Date();
    const roomName = `room_${appointment._id.toString()}`;

    if (!telehealthDoc) {
      telehealthDoc = await TelehealthSession.create({
        appointmentId: appointment._id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        roomName,
        status: 'waiting',
        doctorJoined: isDoctor,
        patientJoined: isPatient,
        startedAt: isDoctor && isPatient ? now : null,
      });
    } else {
      if (isDoctor) telehealthDoc.doctorJoined = true;
      if (isPatient) telehealthDoc.patientJoined = true;

      // If both have joined and session hasn't started yet, mark in-progress
      if (telehealthDoc.doctorJoined && telehealthDoc.patientJoined) {
        if (telehealthDoc.status === 'waiting') {
          telehealthDoc.status = 'in-progress';
          if (!telehealthDoc.startedAt) {
            telehealthDoc.startedAt = now;
          }
        }
      }

      await telehealthDoc.save();
    }

    revalidatePath(`/doctor/telehealth/${appointmentId}`);
    revalidatePath(`/patient/telehealth/${appointmentId}`);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(telehealthDoc.toObject())),
    };
  } catch (error) {
    console.error('getOrCreateTelehealthSessionAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join telehealth session',
    };
  }
}

export async function concludeTelehealthSessionAction(
  input: unknown
): Promise<ActionResponse<{ status: TelehealthSessionStatus; durationSeconds: number }>> {
  try {
    const session = await ensureSession(['doctor', 'patient', 'admin', 'superadmin']);
    const parseResult = concludeSessionSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, notesSummary } = parseResult.data;
    await connectDB();

    const telehealthDoc = await TelehealthSession.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      isDeleted: false,
    });

    if (!telehealthDoc) {
      return { success: false, error: 'Telehealth session record not found' };
    }

    const now = new Date();
    let durationSeconds = telehealthDoc.durationSeconds || 0;
    if (telehealthDoc.startedAt) {
      durationSeconds = Math.max(
        0,
        Math.round((now.getTime() - new Date(telehealthDoc.startedAt).getTime()) / 1000)
      );
    }

    telehealthDoc.status = 'concluded';
    telehealthDoc.endedAt = now;
    telehealthDoc.durationSeconds = durationSeconds;
    if (notesSummary) {
      telehealthDoc.notesSummary = notesSummary;
    }
    await telehealthDoc.save();

    // Signal both peers that consultation has officially concluded
    const userRole = (session.user as any).role === 'doctor' ? 'doctor' : 'patient';
    const peerRole = userRole === 'doctor' ? 'patient' : 'doctor';

    emitTelehealthSignal({
      appointmentId,
      senderRole: userRole,
      targetRole: peerRole,
      signal: {
        type: 'call-ended',
        senderName: session.user.name,
        timestamp: Date.now(),
      },
    });

    revalidatePath(`/doctor/telehealth/${appointmentId}`);
    revalidatePath(`/patient/telehealth/${appointmentId}`);
    revalidatePath('/doctor');
    revalidatePath('/patient/appointments');

    return {
      success: true,
      data: {
        status: 'concluded',
        durationSeconds,
      },
    };
  } catch (error) {
    console.error('concludeTelehealthSessionAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to conclude telehealth session',
    };
  }
}

export async function getTelehealthSessionAction(
  appointmentId: string
): Promise<ActionResponse<TelehealthSessionLean | null>> {
  try {
    await connectDB();
    const doc = await TelehealthSession.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      isDeleted: false,
    }).lean<any>();

    if (!doc) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify({ ...doc, id: doc._id.toString() })),
    };
  } catch (error) {
    console.error('getTelehealthSessionAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch telehealth session',
    };
  }
}
