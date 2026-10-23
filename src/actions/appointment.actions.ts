'use server';

import { updateTag, revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Appointment, AppointmentLean, AppointmentWithDetailsLean } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { ensureSession } from '@/lib/session';
import {
  holdSlotSchemaCompiled,
  confirmHeldAppointmentSchemaCompiled,
  cancelAppointmentSchemaCompiled,
  rescheduleAppointmentSchemaCompiled,
} from '@/lib/validations/appointment';
import { getAvailableSlotsForDate, normalizeDateToUTC, DaySlotsResult } from '@/lib/services/slot-engine';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function getAvailableSlotsAction(
  doctorId: string,
  date: string
): Promise<ActionResponse<DaySlotsResult>> {
  try {
    const result = await getAvailableSlotsForDate(doctorId, date);
    return { success: true, data: result };
  } catch (error) {
    console.error('getAvailableSlotsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query slots',
    };
  }
}

export async function holdAppointmentSlotAction(
  input: unknown
): Promise<ActionResponse<AppointmentLean>> {
  try {
    const session = await ensureSession(['patient', 'admin', 'superadmin']);
    const parseResult = holdSlotSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { doctorId, date, startTime, endTime, chiefComplaint, attachmentUrls } =
      parseResult.data;

    await connectDB();

    // 1. Resolve Patient document
    let patient = await Patient.findOne({ userId: session.user.id });
    if (!patient) {
      // Auto-create basic patient profile if not yet created
      patient = await Patient.create({
        userId: session.user.id,
        allergies: [],
        chronicConditions: [],
        documentUrls: [],
      });
    }

    // 2. Doctor lookup
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    if (!doctor.isAcceptingPatients) {
      return {
        success: false,
        error: 'This physician is currently not accepting new appointments.',
      };
    }

    const targetDate = normalizeDateToUTC(date);
    const heldUntil = new Date(Date.now() + 5 * 60 * 1000); // 5-minute checkout lock

    try {
      // Attempt creation with compound partial unique index guard
      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: doctor.departmentId,
        date: targetDate,
        startTime,
        endTime,
        status: 'held',
        heldUntil,
        chiefComplaint,
        attachmentUrls: attachmentUrls || [],
        consultationFeeSnapshot: doctor.consultationFee,
      });

      updateTag(`doctor-slots-${doctorId}`);
      revalidatePath('/patient/book');

      return {
        success: true,
        data: JSON.parse(JSON.stringify(appointment.toObject())),
      };
    } catch (dbError: any) {
      // Mongo unique index violation (code 11000)
      if (dbError.code === 11000) {
        return {
          success: false,
          error: 'SLOT_TAKEN: This appointment slot was just selected by another patient. Please choose an alternative time.',
        };
      }
      throw dbError;
    }
  } catch (error) {
    console.error('holdAppointmentSlotAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hold appointment slot',
    };
  }
}

export async function confirmHeldAppointmentAction(
  input: unknown
): Promise<ActionResponse<AppointmentLean>> {
  try {
    const session = await ensureSession(['patient', 'admin', 'superadmin']);
    const parseResult = confirmHeldAppointmentSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, chiefComplaint, attachmentUrls } = parseResult.data;
    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment record not found' };
    }

    // Role check: Patient must own the appointment unless admin
    if ((session.user as any).role === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return { success: false, error: 'Unauthorized to confirm this appointment' };
      }
    }

    if (appointment.status !== 'held') {
      return {
        success: false,
        error: `Cannot confirm appointment in '${appointment.status}' state.`,
      };
    }

    // Check if 5-minute hold expired
    if (appointment.heldUntil && new Date(appointment.heldUntil) < new Date()) {
      return {
        success: false,
        error: 'HOLD_EXPIRED: Your 5-minute reservation expired. Please select the slot again.',
      };
    }

    // Transition state: held -> confirmed
    appointment.status = 'confirmed';
    appointment.heldUntil = null;
    if (chiefComplaint) appointment.chiefComplaint = chiefComplaint;
    if (attachmentUrls && attachmentUrls.length > 0) {
      appointment.attachmentUrls = attachmentUrls;
    }

    await appointment.save();

    updateTag(`doctor-slots-${appointment.doctorId.toString()}`);
    updateTag('patient-appointments');
    revalidatePath('/patient/appointments');
    revalidatePath('/doctor');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(appointment.toObject())),
    };
  } catch (error) {
    console.error('confirmHeldAppointmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm appointment',
    };
  }
}

export async function releaseHeldSlotAction(
  appointmentId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await ensureSession(['patient', 'admin', 'superadmin']);
    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: true, data: { id: appointmentId } };
    }

    if (appointment.status === 'held') {
      const docId = appointment.doctorId.toString();
      await Appointment.findByIdAndDelete(appointmentId);
      updateTag(`doctor-slots-${docId}`);
      revalidatePath('/patient/book');
    }

    return { success: true, data: { id: appointmentId } };
  } catch (error) {
    console.error('releaseHeldSlotAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release slot',
    };
  }
}

export async function cancelAppointmentAction(
  input: unknown
): Promise<ActionResponse<AppointmentLean>> {
  try {
    const session = await ensureSession(['patient', 'doctor', 'admin', 'superadmin']);
    const parseResult = cancelAppointmentSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, reason } = parseResult.data;
    await connectDB();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    const userRole = (session.user as any).role;

    // Verify ownership for patient/doctor
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return { success: false, error: 'Unauthorized to cancel this appointment' };
      }

      // Check 4-hour cancellation policy for patients
      const apptDateTime = new Date(appointment.date);
      const [h, m] = appointment.startTime.split(':').map(Number);
      apptDateTime.setUTCHours(h, m, 0, 0);

      const hoursUntilVisit = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilVisit < 4) {
        return {
          success: false,
          error: 'Appointments cannot be cancelled within 4 hours of the scheduled time. Please contact the clinic directly.',
        };
      }
    }

    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return { success: false, error: 'Unauthorized to cancel another physician appointment' };
      }
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = new mongoose.Types.ObjectId(session.user.id);
    appointment.cancelledAt = new Date();
    appointment.heldUntil = null;

    await appointment.save();

    updateTag(`doctor-slots-${appointment.doctorId.toString()}`);
    updateTag('patient-appointments');
    revalidatePath('/patient/appointments');
    revalidatePath('/doctor');
    revalidatePath('/admin');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(appointment.toObject())),
    };
  } catch (error) {
    console.error('cancelAppointmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel appointment',
    };
  }
}

export async function rescheduleAppointmentAction(
  input: unknown
): Promise<ActionResponse<AppointmentLean>> {
  try {
    const session = await ensureSession(['patient', 'doctor', 'admin', 'superadmin']);
    const parseResult = rescheduleAppointmentSchemaCompiled.safeParse(input);

    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { appointmentId, newDoctorId, newDate, newStartTime, newEndTime, reason } =
      parseResult.data;

    await connectDB();

    const targetDate = normalizeDateToUTC(newDate);

    // Multi-document ACID transaction to ensure zero collision and atomicity
    const dbSession = await mongoose.startSession();
    let updatedDoc: any = null;

    try {
      await dbSession.withTransaction(async () => {
        // Step 1: Check target slot collision
        const collision = await Appointment.findOne({
          doctorId: new mongoose.Types.ObjectId(newDoctorId),
          date: targetDate,
          startTime: newStartTime,
          status: { $in: ['held', 'pending', 'confirmed'] },
          _id: { $ne: new mongoose.Types.ObjectId(appointmentId) },
        }).session(dbSession);

        if (collision) {
          throw new Error('TARGET_SLOT_OCCUPIED: The selected destination slot is no longer available.');
        }

        // Step 2: Fetch and verify original appointment
        const original = await Appointment.findById(appointmentId).session(dbSession);
        if (!original) {
          throw new Error('Appointment not found');
        }

        // Step 3: Update appointment
        original.doctorId = new mongoose.Types.ObjectId(newDoctorId);
        original.date = targetDate;
        original.startTime = newStartTime;
        original.endTime = newEndTime;
        original.status = 'confirmed';
        original.heldUntil = null;
        if (reason) {
          original.cancellationReason = `Rescheduled: ${reason}`;
        }

        updatedDoc = await original.save({ session: dbSession });
      }, {
        maxCommitTimeMS: 5000,
      });
    } finally {
      await dbSession.endSession();
    }

    updateTag(`doctor-slots-${newDoctorId}`);
    updateTag('patient-appointments');
    revalidatePath('/patient/appointments');
    revalidatePath('/doctor');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedDoc.toObject())),
    };
  } catch (error) {
    console.error('rescheduleAppointmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reschedule appointment',
    };
  }
}

export async function getPatientAppointmentsAction(): Promise<ActionResponse<AppointmentWithDetailsLean[]>> {
  try {
    const session = await ensureSession(['patient', 'admin', 'superadmin']);
    await connectDB();

    const patient = await Patient.findOne({ userId: session.user.id });
    if (!patient) {
      return { success: true, data: [] };
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email image' },
          { path: 'departmentId', select: 'name slug iconName' },
        ],
      })
      .populate('departmentId', 'name slug iconName')
      .sort({ date: -1, startTime: -1 })
      .lean<any[]>();

    const mapped: AppointmentWithDetailsLean[] = appointments.map((a) => ({
      ...a,
      id: a._id.toString(),
      doctor: a.doctorId
        ? {
            ...a.doctorId,
            id: a.doctorId._id.toString(),
            user: a.doctorId.userId,
            department: a.doctorId.departmentId,
          }
        : undefined,
      department: a.departmentId
        ? { ...a.departmentId, id: a.departmentId._id.toString() }
        : undefined,
    }));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(mapped)),
    };
  } catch (error) {
    console.error('getPatientAppointmentsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointments',
    };
  }
}

export async function getDoctorDailyQueueAction(
  doctorId?: string,
  dateInput?: string
): Promise<ActionResponse<AppointmentWithDetailsLean[]>> {
  try {
    const session = await ensureSession(['doctor', 'admin', 'superadmin']);
    await connectDB();

    let targetDoctorId = doctorId;

    if (!targetDoctorId) {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor) {
        return { success: true, data: [] };
      }
      targetDoctorId = doctor._id.toString();
    }

    const targetDate = dateInput ? normalizeDateToUTC(dateInput) : normalizeDateToUTC(new Date());

    const appointments = await Appointment.find({
      doctorId: new mongoose.Types.ObjectId(targetDoctorId),
      date: targetDate,
      status: { $in: ['confirmed', 'completed', 'no-show', 'cancelled'] },
    })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone image' },
      })
      .populate('departmentId', 'name slug iconName')
      .sort({ startTime: 1 })
      .lean<any[]>();

    const mapped: AppointmentWithDetailsLean[] = appointments.map((a) => ({
      ...a,
      id: a._id.toString(),
      patient: a.patientId
        ? {
            ...a.patientId,
            id: a.patientId._id.toString(),
            user: a.patientId.userId,
          }
        : undefined,
      department: a.departmentId
        ? { ...a.departmentId, id: a.departmentId._id.toString() }
        : undefined,
    }));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(mapped)),
    };
  } catch (error) {
    console.error('getDoctorDailyQueueAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch doctor queue',
    };
  }
}
