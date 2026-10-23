import { z } from 'zod';

export const holdSlotSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:mm'),
  chiefComplaint: z.string().max(2000).optional(),
  attachmentUrls: z.array(z.string().url()).optional().default([]),
});

export const confirmHeldAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  chiefComplaint: z.string().max(2000).optional(),
  attachmentUrls: z.array(z.string().url()).optional().default([]),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  reason: z.string().trim().min(3, 'Cancellation reason must be at least 3 characters').max(1000),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  newDoctorId: z.string().min(1, 'Doctor ID is required'),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  newStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm'),
  newEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:mm'),
  reason: z.string().max(1000).optional(),
});

export type HoldSlotInput = z.infer<typeof holdSlotSchema>;
export type ConfirmHeldAppointmentInput = z.infer<typeof confirmHeldAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const holdSlotSchemaCompiled = z.compile(holdSlotSchema);
export const confirmHeldAppointmentSchemaCompiled = z.compile(confirmHeldAppointmentSchema);
export const cancelAppointmentSchemaCompiled = z.compile(cancelAppointmentSchema);
export const rescheduleAppointmentSchemaCompiled = z.compile(rescheduleAppointmentSchema);
