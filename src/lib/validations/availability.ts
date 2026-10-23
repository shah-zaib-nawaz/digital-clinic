import { z } from 'zod';

export const daySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  slotDurationMinutes: z.number().int().min(10).max(120).default(30),
  isActive: z.boolean().default(true),
});

export const weeklyScheduleSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  slots: z.array(daySlotSchema).length(7, 'Must provide 7 daily schedule configurations (Sun-Sat)'),
});

export type DaySlotInput = z.infer<typeof daySlotSchema>;
export type WeeklyScheduleInput = z.infer<typeof weeklyScheduleSchema>;

export const weeklyScheduleSchemaCompiled = z.compile(weeklyScheduleSchema);
