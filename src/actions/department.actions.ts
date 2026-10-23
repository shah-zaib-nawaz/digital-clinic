'use server';

import { updateTag, revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Department, DepartmentLean } from '@/models/Department';
import { ensureSession } from '@/lib/session';
import {
  departmentSchemaCompiled,
  departmentUpdateSchemaCompiled,
} from '@/lib/validations/department';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function getDepartmentsAction(includeInactive = false): Promise<ActionResponse<DepartmentLean[]>> {
  try {
    await connectDB();
    const filter = includeInactive ? {} : { isActive: true };
    const departments = await Department.find(filter)
      .sort({ name: 1 })
      .lean<DepartmentLean[]>();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(departments)),
    };
  } catch (error) {
    console.error('getDepartmentsAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch departments',
    };
  }
}

export async function createDepartmentAction(input: unknown): Promise<ActionResponse<DepartmentLean>> {
  try {
    await ensureSession(['admin', 'superadmin']);

    const parseResult = departmentSchemaCompiled.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    await connectDB();

    const existingSlug = await Department.findOne({ slug: parseResult.data.slug });
    if (existingSlug) {
      return {
        success: false,
        error: 'A department with this URL slug already exists.',
      };
    }

    const existingName = await Department.findOne({ name: parseResult.data.name });
    if (existingName) {
      return {
        success: false,
        error: 'A department with this name already exists.',
      };
    }

    const created = await Department.create(parseResult.data);

    updateTag('doctors-directory');
    updateTag('departments');
    revalidatePath('/admin/departments');
    revalidatePath('/doctors');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(created.toObject())),
    };
  } catch (error) {
    console.error('createDepartmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create department',
    };
  }
}

export async function updateDepartmentAction(input: unknown): Promise<ActionResponse<DepartmentLean>> {
  try {
    await ensureSession(['admin', 'superadmin']);

    const parseResult = departmentUpdateSchemaCompiled.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { id, ...dataToUpdate } = parseResult.data;
    await connectDB();

    if (dataToUpdate.slug) {
      const slugCollision = await Department.findOne({
        slug: dataToUpdate.slug,
        _id: { $ne: id },
      });
      if (slugCollision) {
        return {
          success: false,
          error: 'A department with this URL slug already exists.',
        };
      }
    }

    if (dataToUpdate.name) {
      const nameCollision = await Department.findOne({
        name: dataToUpdate.name,
        _id: { $ne: id },
      });
      if (nameCollision) {
        return {
          success: false,
          error: 'A department with this name already exists.',
        };
      }
    }

    const updated = await Department.findByIdAndUpdate(
      id,
      { $set: dataToUpdate },
      { new: true, runValidators: true }
    ).lean<DepartmentLean>();

    if (!updated) {
      return {
        success: false,
        error: 'Department not found',
      };
    }

    updateTag('doctors-directory');
    updateTag('departments');
    revalidatePath('/admin/departments');
    revalidatePath('/doctors');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
    };
  } catch (error) {
    console.error('updateDepartmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update department',
    };
  }
}

export async function toggleDepartmentActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResponse<{ id: string; isActive: boolean }>> {
  try {
    await ensureSession(['admin', 'superadmin']);
    await connectDB();

    const updated = await Department.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    );

    if (!updated) {
      return {
        success: false,
        error: 'Department not found',
      };
    }

    updateTag('doctors-directory');
    updateTag('departments');
    revalidatePath('/admin/departments');
    revalidatePath('/doctors');

    return {
      success: true,
      data: { id, isActive: updated.isActive },
    };
  } catch (error) {
    console.error('toggleDepartmentActiveAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle status',
    };
  }
}

export async function deleteDepartmentAction(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    await ensureSession(['admin', 'superadmin']);
    await connectDB();

    const department = await Department.findById(id);
    if (!department) {
      return {
        success: false,
        error: 'Department not found',
      };
    }

    await department.softDelete();

    updateTag('doctors-directory');
    updateTag('departments');
    revalidatePath('/admin/departments');
    revalidatePath('/doctors');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('deleteDepartmentAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete department',
    };
  }
}
