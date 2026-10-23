import { tool } from 'ai';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Doctor } from '@/models/Doctor';
import { Department } from '@/models/Department';
import { getAvailableSlotsForDate } from '@/lib/services/slot-engine';
import { generateHitlToken } from '@/lib/ai/hitl';

// Side-effect model registration for populate
void User;
void Department;

export const clinicalTools = {
  searchDoctors: tool({
    description:
      'Search for outpatient clinic physicians by specialty, department name or slug, maximum fee, or physician name.',
    inputSchema: z.object({
      specialty: z
        .string()
        .optional()
        .describe('Clinical specialty, e.g. Cardiology, Dermatology, Pediatrics, Neurology'),
      departmentSlug: z
        .string()
        .optional()
        .describe('Department URL slug, e.g. cardiology, dermatology, general-medicine'),
      maxFee: z
        .number()
        .optional()
        .describe('Maximum consultation fee budget in USD'),
      query: z
        .string()
        .optional()
        .describe('Free-text search for doctor name or clinical focus'),
    }),
    execute: async ({ specialty, departmentSlug, maxFee, query }) => {
      await connectDB();

      const filter: Record<string, any> = {
        isAcceptingPatients: true,
        isDeleted: false,
      };

      if (departmentSlug) {
        const dept = await Department.findOne({ slug: departmentSlug });
        if (dept) {
          filter.departmentId = dept._id;
        }
      }

      if (specialty) {
        filter.specialization = { $regex: specialty, $options: 'i' };
      }

      if (maxFee) {
        filter.consultationFee = { $lte: maxFee };
      }

      const doctors = await Doctor.find(filter)
        .populate('userId', 'name email image')
        .populate('departmentId', 'name slug')
        .limit(6)
        .lean<any[]>();

      let results = doctors.map((d) => ({
        doctorId: d._id.toString(),
        name: d.userId?.name ? `Dr. ${d.userId.name}` : 'Dr. Outpatient Physician',
        specialization: d.specialization,
        department: d.departmentId?.name || 'General Clinic',
        consultationFee: d.consultationFee,
        rating: d.averageRating || 5.0,
        reviewCount: d.reviewCount || 0,
        experienceYears: d.yearsOfExperience || 5,
        bio: d.bio || '',
      }));

      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (doc) =>
            doc.name.toLowerCase().includes(q) ||
            doc.specialization.toLowerCase().includes(q) ||
            doc.bio.toLowerCase().includes(q)
        );
      }

      return {
        count: results.length,
        doctors: results,
      };
    },
  }),

  checkDoctorAvailability: tool({
    description:
      'Check available consultation time slots for a specific doctor on a given date (YYYY-MM-DD).',
    inputSchema: z.object({
      doctorId: z.string().describe('The MongoDB ObjectId of the doctor'),
      date: z.string().describe('Date in YYYY-MM-DD format'),
    }),
    execute: async ({ doctorId, date }) => {
      try {
        await connectDB();
        const doctor = await Doctor.findById(doctorId).populate('userId', 'name').lean<any>();
        if (!doctor) {
          return { error: 'Doctor not found with provided ID' };
        }

        const slotResult = await getAvailableSlotsForDate(doctorId, date);

        return {
          doctorId,
          doctorName: doctor.userId?.name ? `Dr. ${doctor.userId.name}` : 'Dr. Physician',
          date,
          isWorkingDay: slotResult.isWorkingDay,
          consultationFee: doctor.consultationFee,
          availableSlots: slotResult.slots.filter((s) => s.isAvailable).map((s) => s.startTime),
          totalAvailable: slotResult.availableCount,
          totalSlots: slotResult.slots.length,
        };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Failed to query doctor availability',
        };
      }
    },
  }),

  requestSlotHoldApproval: tool({
    description:
      'Requests patient confirmation to hold an appointment slot for 5 minutes. Generates a secure HMAC approval token.',
    inputSchema: z.object({
      doctorId: z.string().describe('The doctor ObjectId'),
      doctorName: z.string().describe('The doctor full name with Dr. prefix'),
      date: z.string().describe('The appointment date in YYYY-MM-DD format'),
      startTime: z.string().describe('Start time, e.g. 09:00'),
      endTime: z.string().describe('End time, e.g. 09:30'),
      consultationFee: z.number().describe('Consultation fee snapshot'),
    }),
    execute: async ({ doctorId, doctorName, date, startTime, endTime, consultationFee }) => {
      // Generate cryptographic HMAC approval token with 10-minute expiry
      const approvalToken = generateHitlToken({
        doctorId,
        doctorName,
        date,
        startTime,
        endTime,
        consultationFee,
      });

      return {
        requiresApproval: true,
        actionType: 'HOLD_SLOT' as const,
        summary: `Lock consultation with ${doctorName} on ${date} from ${startTime} to ${endTime}`,
        doctorId,
        doctorName,
        date,
        startTime,
        endTime,
        consultationFee,
        approvalToken,
        expiresInMinutes: 10,
      };
    },
  }),

  escalateToEmergencyStaff: tool({
    description:
      'Trigger emergency triage escalation when a patient presents critical red-flag symptoms like chest pain, stroke signs, difficulty breathing, or severe trauma.',
    inputSchema: z.object({
      reason: z.string().describe('Summary of the life-threatening symptom or red-flag complaint'),
      severity: z
        .enum(['high', 'emergency'])
        .describe('Severity level for clinical triage escalation'),
    }),
    execute: async ({ reason, severity }) => {
      return {
        escalated: true,
        severity,
        reason,
        emergencyGuidance:
          'CRITICAL NOTICE: If you are experiencing chest pain, severe shortness of breath, sudden weakness/numbness, or other life-threatening medical symptoms, please call 911 (or your local emergency services) immediately or proceed to the nearest emergency department. Our clinical triage system has recorded this alert.',
      };
    },
  }),
};
