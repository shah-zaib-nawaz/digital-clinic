import { cacheLife, cacheTag } from 'next/cache';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Doctor, DoctorWithDetailsLean } from '@/models/Doctor';
import { Department, DepartmentLean } from '@/models/Department';
import { AvailabilitySlot, AvailabilitySlotLean } from '@/models/AvailabilitySlot';

export interface DoctorDirectoryFilters {
  departmentSlug?: string;
  acceptingOnly?: boolean;
  search?: string;
}

export async function getCachedDepartments(): Promise<DepartmentLean[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('departments');

  await connectDB();
  const departments = await Department.find({ isActive: true })
    .sort({ name: 1 })
    .lean<DepartmentLean[]>();

  return JSON.parse(JSON.stringify(departments));
}

export async function getCachedDoctorDirectory(
  filters: DoctorDirectoryFilters = {}
): Promise<DoctorWithDetailsLean[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('doctors-directory');

  await connectDB();

  const filter: Record<string, any> = {};

  if (filters.acceptingOnly) {
    filter.isAcceptingPatients = true;
  }

  if (filters.departmentSlug && filters.departmentSlug !== 'all') {
    const dept = await Department.findOne({ slug: filters.departmentSlug, isActive: true });
    if (dept) {
      filter.departmentId = dept._id;
    } else {
      // If department slug doesn't exist, return empty
      return [];
    }
  }

  if (filters.search && filters.search.trim()) {
    filter.$text = { $search: filters.search.trim() };
  }

  const doctors = await Doctor.find(filter)
    .populate('userId', 'name email image')
    .populate('departmentId', 'name slug iconName description')
    .sort({ averageRating: -1, reviewCount: -1, yearsOfExperience: -1 })
    .lean<any[]>();

  const formatted: DoctorWithDetailsLean[] = doctors.map((d) => ({
    ...d,
    id: d._id.toString(),
    user: d.userId ? { ...d.userId, id: d.userId._id.toString() } : undefined,
    department: d.departmentId
      ? { ...d.departmentId, id: d.departmentId._id.toString() }
      : undefined,
  }));

  return JSON.parse(JSON.stringify(formatted));
}

export interface DoctorFullProfile extends DoctorWithDetailsLean {
  weeklySlots: AvailabilitySlotLean[];
}

export async function getCachedDoctorProfile(
  doctorId: string
): Promise<DoctorFullProfile | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`doctor-${doctorId}`);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return null;
  }

  await connectDB();

  const doctor = await Doctor.findById(doctorId)
    .populate('userId', 'name email image phone')
    .populate('departmentId', 'name slug iconName description')
    .lean<any>();

  if (!doctor) {
    return null;
  }

  const slots = await AvailabilitySlot.find({
    doctorId: doctor._id,
    isActive: true,
  })
    .sort({ dayOfWeek: 1 })
    .lean<AvailabilitySlotLean[]>();

  const formatted: DoctorFullProfile = {
    ...doctor,
    id: doctor._id.toString(),
    user: doctor.userId ? { ...doctor.userId, id: doctor.userId._id.toString() } : undefined,
    department: doctor.departmentId
      ? { ...doctor.departmentId, id: doctor.departmentId._id.toString() }
      : undefined,
    weeklySlots: JSON.parse(JSON.stringify(slots)),
  };

  return JSON.parse(JSON.stringify(formatted));
}
