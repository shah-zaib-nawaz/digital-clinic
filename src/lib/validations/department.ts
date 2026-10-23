import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(100),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
  iconName: z.string().trim().min(2, 'Icon name is required').max(50).default('Activity'),
  isActive: z.boolean().default(true),
});

export const departmentUpdateSchema = departmentSchema.partial().extend({
  id: z.string().min(1, 'Department ID is required'),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;

// Compiled Ahead-of-Time Validators with jitless CSP fallback
export const departmentSchemaCompiled = z.compile(departmentSchema);

export const departmentUpdateSchemaCompiled = z.compile(departmentUpdateSchema);
