import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  departmentId: z.string().min(1, 'Please select a clinical department'),
  licenseNumber: z
    .string()
    .trim()
    .min(3, 'License number must be at least 3 characters')
    .max(50),
  specialization: z
    .string()
    .trim()
    .min(2, 'Specialization must be at least 2 characters')
    .max(100),
  qualifications: z
    .array(z.string().trim().min(1))
    .min(1, 'Please provide at least one credential or qualification'),
  yearsOfExperience: z
    .number()
    .int()
    .min(0, 'Experience cannot be negative')
    .max(70, 'Experience cannot exceed 70 years'),
  consultationFee: z
    .number()
    .min(0, 'Consultation fee cannot be negative')
    .max(10000, 'Fee exceeds system limit'),
  bio: z
    .string()
    .trim()
    .min(20, 'Clinical bio must be at least 20 characters')
    .max(2500, 'Clinical bio cannot exceed 2500 characters'),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  isAcceptingPatients: z.boolean().default(true),
});

export const updateDoctorSchema = z.object({
  id: z.string().min(1, 'Doctor ID is required'),
  name: z.string().trim().min(2).max(100).optional(),
  departmentId: z.string().min(1).optional(),
  licenseNumber: z.string().trim().min(3).max(50).optional(),
  specialization: z.string().trim().min(2).max(100).optional(),
  qualifications: z.array(z.string().trim().min(1)).optional(),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  consultationFee: z.number().min(0).max(10000).optional(),
  bio: z.string().trim().min(20).max(2500).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  isAcceptingPatients: z.boolean().optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

export const createDoctorSchemaCompiled = z.compile(createDoctorSchema);

export const updateDoctorSchemaCompiled = z.compile(updateDoctorSchema);
