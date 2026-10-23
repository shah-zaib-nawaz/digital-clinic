import { z } from 'zod';

export const vitalSignsSchema = z.object({
  bloodPressureSystolic: z.number().min(40).max(300).optional().nullable(),
  bloodPressureDiastolic: z.number().min(20).max(200).optional().nullable(),
  heartRate: z.number().min(30).max(250).optional().nullable(),
  temperatureCelsius: z.number().min(30).max(45).optional().nullable(),
  respiratoryRate: z.number().min(5).max(60).optional().nullable(),
  oxygenSaturation: z.number().min(50).max(100).optional().nullable(),
  weightKg: z.number().min(1).max(500).optional().nullable(),
  heightCm: z.number().min(30).max(300).optional().nullable(),
});

export const icd10CodeSchema = z.object({
  code: z.string().min(2).max(10),
  description: z.string().min(2).max(255),
});

export const soapNoteSchema = z.object({
  subjective: z.string().default(''),
  objective: z.string().default(''),
  assessment: z.string().default(''),
  plan: z.string().default(''),
});

export const saveVisitNoteSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  soap: soapNoteSchema,
  vitals: vitalSignsSchema.optional(),
  icd10Codes: z.array(icd10CodeSchema).default([]),
  status: z.enum(['draft', 'finalized']).default('draft'),
});

export const medicationItemSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g. 10mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g. Twice daily)'),
  duration: z.string().min(1, 'Duration is required (e.g. 7 days)'),
  instructions: z.string().optional(),
  refills: z.number().min(0).default(0),
});

export const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  visitNoteId: z.string().optional(),
  medications: z.array(medicationItemSchema).min(1, 'At least one medication is required'),
  notes: z.string().optional(),
});

export const saveVisitNoteSchemaCompiled = z.compile(saveVisitNoteSchema);
export const createPrescriptionSchemaCompiled = z.compile(createPrescriptionSchema);

export type SaveVisitNoteInput = z.infer<typeof saveVisitNoteSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
