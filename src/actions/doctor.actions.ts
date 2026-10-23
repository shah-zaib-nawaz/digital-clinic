'use server';

import { updateTag, revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Doctor, DoctorLean, DoctorWithDetailsLean } from '@/models/Doctor';
import { User } from '@/models/User';
import { Department } from '@/models/Department';
import { ensureSession } from '@/lib/session';
import { auth } from '@/lib/auth';
import {
  createDoctorSchemaCompiled,
  updateDoctorSchemaCompiled,
} from '@/lib/validations/doctor';
import { paginateQuery, PaginatedResult } from '@/lib/mongoose-utils';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createDoctorAction(input: unknown): Promise<ActionResponse<DoctorLean>> {
  try {
    await ensureSession(['admin', 'superadmin']);

    const parseResult = createDoctorSchemaCompiled.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const data = parseResult.data;
    await connectDB();

    // Check if department exists
    const department = await Department.findById(data.departmentId);
    if (!department) {
      return {
        success: false,
        error: 'Selected department does not exist',
      };
    }

    // Check license number uniqueness
    const existingLicense = await Doctor.findOne({ licenseNumber: data.licenseNumber });
    if (existingLicense) {
      return {
        success: false,
        error: `A doctor with medical license ${data.licenseNumber} is already registered.`,
      };
    }

    // Find or create User
    let user = await User.findOne({ email: data.email });
    if (user) {
      // Check if user is already a doctor
      const existingDoctorProfile = await Doctor.findOne({ userId: user._id });
      if (existingDoctorProfile) {
        return {
          success: false,
          error: `A doctor profile already exists for ${data.email}.`,
        };
      }
      user.role = 'doctor';
      if (data.avatarUrl) user.image = data.avatarUrl;
      await user.save();
    } else {
      // Create user through Better Auth or User model
      try {
        const authUser = await auth.api.signUpEmail({
          body: {
            email: data.email,
            password: 'ClinicDoctor2026!',
            name: data.name,
          },
        });
        if (authUser && authUser.user) {
          user = await User.findById(authUser.user.id);
          if (user) {
            user.role = 'doctor';
            if (data.avatarUrl) user.image = data.avatarUrl;
            await user.save();
          }
        }
      } catch (authErr) {
        // Fallback to direct User model create
        user = await User.create({
          name: data.name,
          email: data.email,
          role: 'doctor',
          image: data.avatarUrl,
        });
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'Failed to create or link user account for doctor.',
      };
    }

    const newDoctor = await Doctor.create({
      userId: user._id,
      departmentId: department._id,
      licenseNumber: data.licenseNumber,
      specialization: data.specialization,
      qualifications: data.qualifications,
      yearsOfExperience: data.yearsOfExperience,
      consultationFee: data.consultationFee,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      isAcceptingPatients: data.isAcceptingPatients,
      averageRating: 5.0,
      reviewCount: 0,
    });

    updateTag('doctors-directory');
    revalidatePath('/admin/doctors');
    revalidatePath('/doctors');

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newDoctor.toObject())),
    };
  } catch (error) {
    console.error('createDoctorAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register doctor',
    };
  }
}

export async function updateDoctorAction(input: unknown): Promise<ActionResponse<DoctorLean>> {
  try {
    const session = await ensureSession(['admin', 'superadmin', 'doctor']);

    const parseResult = updateDoctorSchemaCompiled.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parseResult.error.flatten().fieldErrors,
      };
    }

    const { id, name, ...updateFields } = parseResult.data;
    await connectDB();

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return {
        success: false,
        error: 'Doctor record not found',
      };
    }

    // Role check: If role is doctor, verify that they are editing their own profile
    if ((session.user as any).role === 'doctor') {
      const currentDoctor = await Doctor.findOne({ userId: session.user.id });
      if (!currentDoctor || currentDoctor._id.toString() !== id) {
        return {
          success: false,
          error: 'Forbidden: You can only edit your own doctor profile.',
        };
      }
    }

    // Check license number collision if changing
    if (updateFields.licenseNumber && updateFields.licenseNumber !== doctor.licenseNumber) {
      const collision = await Doctor.findOne({
        licenseNumber: updateFields.licenseNumber,
        _id: { $ne: id },
      });
      if (collision) {
        return {
          success: false,
          error: `Medical license ${updateFields.licenseNumber} is already in use.`,
        };
      }
    }

    // Update linked user if name or avatar changed
    if (name || updateFields.avatarUrl) {
      await User.findByIdAndUpdate(doctor.userId, {
        $set: {
          ...(name && { name }),
          ...(updateFields.avatarUrl && { image: updateFields.avatarUrl }),
        },
      });
    }

    const updated = await Doctor.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean<DoctorLean>();

    if (!updated) {
      return {
        success: false,
        error: 'Failed to update doctor record',
      };
    }

    updateTag('doctors-directory');
    updateTag(`doctor-${id}`);
    revalidatePath('/admin/doctors');
    revalidatePath(`/admin/doctors/${id}`);
    revalidatePath('/doctors');
    revalidatePath(`/doctors/${id}`);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
    };
  } catch (error) {
    console.error('updateDoctorAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update doctor profile',
    };
  }
}

export async function toggleDoctorAcceptingAction(
  doctorId: string,
  isAcceptingPatients: boolean
): Promise<ActionResponse<{ id: string; isAcceptingPatients: boolean }>> {
  try {
    const session = await ensureSession(['admin', 'superadmin', 'doctor']);
    await connectDB();

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    if ((session.user as any).role === 'doctor') {
      const currentDoctor = await Doctor.findOne({ userId: session.user.id });
      if (!currentDoctor || currentDoctor._id.toString() !== doctorId) {
        return { success: false, error: 'Unauthorized to modify another doctor status' };
      }
    }

    doctor.isAcceptingPatients = isAcceptingPatients;
    await doctor.save();

    updateTag('doctors-directory');
    updateTag(`doctor-${doctorId}`);
    revalidatePath('/admin/doctors');
    revalidatePath('/doctors');

    return {
      success: true,
      data: { id: doctorId, isAcceptingPatients },
    };
  } catch (error) {
    console.error('toggleDoctorAcceptingAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle status',
    };
  }
}

export async function deleteDoctorAction(doctorId: string): Promise<ActionResponse<{ id: string }>> {
  try {
    await ensureSession(['admin', 'superadmin']);
    await connectDB();

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    await doctor.softDelete();

    updateTag('doctors-directory');
    revalidatePath('/admin/doctors');
    revalidatePath('/doctors');

    return { success: true, data: { id: doctorId } };
  } catch (error) {
    console.error('deleteDoctorAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove doctor',
    };
  }
}

export async function getDoctorByIdAction(id: string): Promise<ActionResponse<DoctorWithDetailsLean>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid doctor ID format' };
    }

    const doctor = await Doctor.findById(id)
      .populate('userId', 'name email image role phone')
      .populate('departmentId', 'name slug iconName description isActive')
      .lean<any>();

    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    const formatted: DoctorWithDetailsLean = {
      ...doctor,
      id: doctor._id.toString(),
      user: doctor.userId ? { ...doctor.userId, id: doctor.userId._id.toString() } : undefined,
      department: doctor.departmentId
        ? { ...doctor.departmentId, id: doctor.departmentId._id.toString() }
        : undefined,
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(formatted)),
    };
  } catch (error) {
    console.error('getDoctorByIdAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch doctor',
    };
  }
}

export async function getDoctorsPaginatedAction(params: {
  page?: number;
  limit?: number;
  departmentId?: string;
  search?: string;
  acceptingOnly?: boolean;
}): Promise<ActionResponse<PaginatedResult<DoctorWithDetailsLean>>> {
  try {
    await connectDB();

    const filter: Record<string, any> = {};

    if (params.acceptingOnly) {
      filter.isAcceptingPatients = true;
    }

    if (params.departmentId && mongoose.Types.ObjectId.isValid(params.departmentId)) {
      filter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
    }

    if (params.search && params.search.trim()) {
      filter.$text = { $search: params.search.trim() };
    }

    const query = Doctor.find(filter)
      .populate('userId', 'name email image role phone')
      .populate('departmentId', 'name slug iconName description isActive')
      .sort({ averageRating: -1, reviewCount: -1, createdAt: -1 });

    const paginated = await paginateQuery<any>(query, {
      page: params.page || 1,
      limit: params.limit || 12,
    });

    const mappedData = paginated.data.map((d: any) => ({
      ...d,
      id: d._id.toString(),
      user: d.userId ? { ...d.userId, id: d.userId._id.toString() } : undefined,
      department: d.departmentId
        ? { ...d.departmentId, id: d.departmentId._id.toString() }
        : undefined,
    }));

    return {
      success: true,
      data: JSON.parse(
        JSON.stringify({
          ...paginated,
          data: mappedData,
        })
      ),
    };
  } catch (error) {
    console.error('getDoctorsPaginatedAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query doctors',
    };
  }
}
