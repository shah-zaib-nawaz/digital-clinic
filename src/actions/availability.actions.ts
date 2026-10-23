'use server';

import { updateTag, revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AvailabilitySlot, AvailabilitySlotLean } from '@/models/AvailabilitySlot';
import { Doctor } from '@/models/Doctor';
import { ensureSession } from '@/lib/session';
import { weeklyScheduleSchemaCompiled } from '@/lib/validations/availability';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function getDoctorAvailabilityAction(
  doctorId: string
): Promise<ActionResponse<AvailabilitySlotLean[]>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return { success: false, error: 'Invalid doctor ID format' };
    }

    const slots = await AvailabilitySlot.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
    })
      .sort({ dayOfWeek: 1 })
      .lean<AvailabilitySlotLean[]>();

    // Build standard 7-day array (0 = Sunday to 6 = Saturday)
    const slotMap = new Map<number, AvailabilitySlotLean>();
    slots.forEach((s) => slotMap.set(s.dayOfWeek, s));

    const fullWeek: any[] = [];
    for (let day = 0; day <= 6; day++) {
      if (slotMap.has(day)) {
        const s = slotMap.get(day)!;
        fullWeek.push({
          ...s,
          id: s._id.toString(),
        });
      } else {
        // Mon-Fri active by default, Sat-Sun off
        const isWeekday = day >= 1 && day <= 5;
        fullWeek.push({
          doctorId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          isActive: isWeekday,
        });
      }
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(fullWeek)),
    };
  } catch (error) {
    console.error('getDoctorAvailabilityAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch doctor availability',
    };
  }
}

export async function updateDoctorWeeklyScheduleAction(
  input: unknown
): Promise<ActionResponse<AvailabilitySlotLean[]>> {
  try {
    const session = await ensureSession(['admin', 'superadmin', 'doctor']);

    const parseResult = weeklyScheduleSchemaCompiled.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { doctorId, slots } = parseResult.data;
    await connectDB();

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    // Role check: If doctor, verify ownership
    if ((session.user as any).role === 'doctor') {
      const currentDoctor = await Doctor.findOne({ userId: session.user.id });
      if (!currentDoctor || currentDoctor._id.toString() !== doctorId) {
        return {
          success: false,
          error: 'Forbidden: You cannot modify schedules for another physician.',
        };
      }
    }

    const updatedSlots: any[] = [];
    const docObjectId = new mongoose.Types.ObjectId(doctorId);

    // Upsert each of the 7 days atomically per day
    for (const slot of slots) {
      const updated = await AvailabilitySlot.findOneAndUpdate(
        { doctorId: docObjectId, dayOfWeek: slot.dayOfWeek },
        {
          $set: {
            doctorId: docObjectId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDurationMinutes: slot.slotDurationMinutes,
            isActive: slot.isActive,
            isDeleted: false,
            deletedAt: null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      updatedSlots.push(updated);
    }

    updateTag(`doctor-slots-${doctorId}`);
    updateTag('doctors-directory');
    revalidatePath(`/admin/doctors/${doctorId}`);
    revalidatePath(`/doctors/${doctorId}`);
    revalidatePath('/doctor/schedule');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedSlots)),
    };
  } catch (error) {
    console.error('updateDoctorWeeklyScheduleAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update weekly availability',
    };
  }
}
