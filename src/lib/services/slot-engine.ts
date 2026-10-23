import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AvailabilitySlot } from '@/models/AvailabilitySlot';
import { Appointment } from '@/models/Appointment';

export interface GeneratedSlot {
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  isAvailable: boolean;
  status: 'available' | 'held' | 'booked';
  heldUntil?: Date | null;
}

export interface DaySlotsResult {
  date: string; // YYYY-MM-DD
  doctorId: string;
  isWorkingDay: boolean;
  slots: GeneratedSlot[];
  availableCount: number;
}

/**
 * Normalizes any Date or date string to midnight UTC (00:00:00.000Z)
 */
export function normalizeDateToUTC(dateInput: string | Date): Date {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const date = d.getUTCDate();
  return new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
}

function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(minutesTotal: number): string {
  const hours = Math.floor(minutesTotal / 60);
  const mins = minutesTotal % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export async function getAvailableSlotsForDate(
  doctorId: string,
  dateInput: string | Date,
  signal?: AbortSignal
): Promise<DaySlotsResult> {
  if (signal?.aborted) {
    throw new Error('Query aborted by caller');
  }

  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new Error('Invalid doctor ID');
  }

  const targetDate = normalizeDateToUTC(dateInput);
  const dateString = targetDate.toISOString().split('T')[0];
  const dayOfWeek = targetDate.getUTCDay();

  // 1. Fetch Doctor's schedule for this day of the week
  const schedule = await AvailabilitySlot.findOne({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    dayOfWeek,
    isActive: true,
  }).lean();

  if (signal?.aborted) throw new Error('Query aborted by caller');

  if (!schedule) {
    return {
      date: dateString,
      doctorId,
      isWorkingDay: false,
      slots: [],
      availableCount: 0,
    };
  }

  // 2. Fetch all active appointments (held, pending, confirmed) for this date
  const now = new Date();
  const existingAppointments = await Appointment.find({
    doctorId: new mongoose.Types.ObjectId(doctorId),
    date: targetDate,
    status: { $in: ['held', 'pending', 'confirmed'] },
  }).lean();

  if (signal?.aborted) throw new Error('Query aborted by caller');

  // Map of occupied slots: startTime -> { status, heldUntil }
  const occupiedMap = new Map<string, { status: string; heldUntil?: Date | null }>();

  for (const appt of existingAppointments) {
    // If it's 'held', verify if hold hasn't expired yet
    if (appt.status === 'held') {
      if (appt.heldUntil && new Date(appt.heldUntil) > now) {
        occupiedMap.set(appt.startTime, {
          status: 'held',
          heldUntil: appt.heldUntil,
        });
      }
    } else {
      occupiedMap.set(appt.startTime, {
        status: appt.status,
        heldUntil: null,
      });
    }
  }

  // 3. Generate all discrete slots based on start/end time and duration
  const startMins = timeStringToMinutes(schedule.startTime);
  const endMins = timeStringToMinutes(schedule.endTime);
  const duration = schedule.slotDurationMinutes || 30;

  const generatedSlots: GeneratedSlot[] = [];
  let availableCount = 0;

  for (let current = startMins; current + duration <= endMins; current += duration) {
    if (signal?.aborted) throw new Error('Query aborted by caller');

    const slotStart = minutesToTimeString(current);
    const slotEnd = minutesToTimeString(current + duration);

    const occupation = occupiedMap.get(slotStart);

    if (!occupation) {
      generatedSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: true,
        status: 'available',
      });
      availableCount++;
    } else if (occupation.status === 'held') {
      generatedSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: false,
        status: 'held',
        heldUntil: occupation.heldUntil,
      });
    } else {
      generatedSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: false,
        status: 'booked',
      });
    }
  }

  return {
    date: dateString,
    doctorId,
    isWorkingDay: true,
    slots: generatedSlots,
    availableCount,
  };
}
