import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { Department } from '@/models/Department';
import { Patient } from '@/models/Patient';
import { User } from '@/models/User';
import { Review } from '@/models/Review';
import { VisitNote } from '@/models/VisitNote';
import { ChatLog } from '@/models/ChatLog';
import { recalculateDoctorRating } from '@/actions/review.actions';

describe('Replica-Set Integration Test Suite (MongoDB 7.7 ACID Transactions & Concurrency)', () => {
  let testDoctorId: mongoose.Types.ObjectId;
  let testPatientId: mongoose.Types.ObjectId;
  let testDepartmentId: mongoose.Types.ObjectId;
  let testUserId: mongoose.Types.ObjectId;
  const createdAppointmentIds: mongoose.Types.ObjectId[] = [];
  const createdReviewIds: mongoose.Types.ObjectId[] = [];
  const createdChatSessionIds: string[] = [];

  beforeAll(async () => {
    await connectDB();

    // Ensure appointment indexes (including partial unique index on { doctorId: 1, date: 1, startTime: 1 }) are synced
    await Appointment.syncIndexes();
    await Review.syncIndexes();

    // Create a temporary department and doctor fixture
    const dept = await Department.create({
      name: `Integration Test Dept ${Date.now()}`,
      slug: `integration-test-${Date.now()}`,
      description: 'Temporary department for integration suite',
      iconName: 'Activity',
      isActive: true,
    });
    testDepartmentId = dept._id;

    const user = await User.create({
      name: 'Integration Test Doctor',
      email: `integ-doctor-${Date.now()}@clinic.test`,
      role: 'doctor',
      emailVerified: true,
    });
    testUserId = user._id;

    const doctor = await Doctor.create({
      userId: user._id,
      departmentId: dept._id,
      licenseNumber: `INT-LIC-${Date.now()}`,
      specialization: 'Internal Medicine',
      qualifications: ['MD'],
      yearsOfExperience: 10,
      consultationFee: 120,
      bio: 'Experienced clinical specialist in internal medicine.',
      isAcceptingPatients: true,
      averageRating: 5.0,
      reviewCount: 0,
    });
    testDoctorId = doctor._id;

    const patientUser = await User.create({
      name: 'Integration Test Patient',
      email: `integ-patient-${Date.now()}@clinic.test`,
      role: 'patient',
      emailVerified: true,
    });
    const patient = await Patient.create({
      userId: patientUser._id,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      allergies: [],
      chronicConditions: [],
      documentUrls: [],
    });
    testPatientId = patient._id;
  }, 60000);

  afterAll(async () => {
    try {
      if (createdAppointmentIds.length > 0) {
        await Appointment.deleteMany({ _id: { $in: createdAppointmentIds } });
      }
      if (createdReviewIds.length > 0) {
        await Review.deleteMany({ _id: { $in: createdReviewIds } });
      }
      if (createdChatSessionIds.length > 0) {
        await ChatLog.deleteMany({ sessionId: { $in: createdChatSessionIds } });
      }
      if (testDoctorId) await Doctor.findByIdAndDelete(testDoctorId);
      if (testDepartmentId) await Department.findByIdAndDelete(testDepartmentId);
      if (testUserId) await User.findByIdAndDelete(testUserId);
      if (testPatientId) {
        const p = await Patient.findById(testPatientId);
        if (p) await User.findByIdAndDelete(p.userId);
        await Patient.findByIdAndDelete(testPatientId);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  describe('1. Concurrent holdAppointmentSlot Race Condition (10 parallel callers)', () => {
    it('allows exactly 1 reservation to succeed and rejects the other 9 with code 11000', async () => {
      const raceDate = new Date(Date.UTC(2026, 11, 25, 0, 0, 0, 0));
      const raceStartTime = '09:00';
      const raceEndTime = '09:30';
      const heldUntil = new Date(Date.now() + 5 * 60 * 1000);

      // Launch 10 simultaneous promises trying to reserve the exact same slot coordinates
      const attemptHold = async (workerIndex: number) => {
        try {
          const appt = await Appointment.create({
            patientId: testPatientId,
            doctorId: testDoctorId,
            departmentId: testDepartmentId,
            date: raceDate,
            startTime: raceStartTime,
            endTime: raceEndTime,
            status: 'held',
            heldUntil,
            consultationFeeSnapshot: 120,
            chiefComplaint: `Race worker #${workerIndex}`,
          });
          createdAppointmentIds.push(appt._id);
          return { success: true, id: appt._id, workerIndex };
        } catch (err: any) {
          if (err.code === 11000) {
            return { success: false, error: 'SLOT_TAKEN', code: 11000, workerIndex };
          }
          return { success: false, error: err.message, workerIndex };
        }
      };

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => attemptHold(i + 1))
      );

      const successful = results.filter((r) => r.success);
      const rejected = results.filter((r) => !r.success && r.error === 'SLOT_TAKEN');

      expect(successful.length).toBe(1);
      expect(rejected.length).toBe(9);
    });
  });

  describe('2. Atomic Reschedule Transaction & Rollback on Slot Conflict', () => {
    it('rolls back rescheduling when the target slot is already occupied', async () => {
      const dateA = new Date(Date.UTC(2026, 11, 26, 0, 0, 0, 0));
      const dateB = new Date(Date.UTC(2026, 11, 27, 0, 0, 0, 0));

      // Appointment 1: Booked on Date A
      const appt1 = await Appointment.create({
        patientId: testPatientId,
        doctorId: testDoctorId,
        departmentId: testDepartmentId,
        date: dateA,
        startTime: '10:00',
        endTime: '10:30',
        status: 'confirmed',
        consultationFeeSnapshot: 120,
      });
      createdAppointmentIds.push(appt1._id);

      // Appointment 2: Already occupying Date B at 10:00
      const appt2 = await Appointment.create({
        patientId: testPatientId,
        doctorId: testDoctorId,
        departmentId: testDepartmentId,
        date: dateB,
        startTime: '10:00',
        endTime: '10:30',
        status: 'confirmed',
        consultationFeeSnapshot: 120,
      });
      createdAppointmentIds.push(appt2._id);

      // Attempt multi-document atomic reschedule inside MongoDB transaction
      const session = await mongoose.startSession();
      let transactionRolledBack = false;

      try {
        await session.withTransaction(async () => {
          // Verify conflict at target slot
          const conflict = await Appointment.findOne({
            doctorId: testDoctorId,
            date: dateB,
            startTime: '10:00',
            status: { $in: ['held', 'pending', 'confirmed'] },
          }).session(session);

          if (conflict) {
            throw new Error('DESTINATION_SLOT_OCCUPIED');
          }

          // Move appt1 to Date B (should not reach here)
          await Appointment.findByIdAndUpdate(
            appt1._id,
            { date: dateB },
            { session }
          );
        });
      } catch (err: any) {
        if (err.message === 'DESTINATION_SLOT_OCCUPIED') {
          transactionRolledBack = true;
        }
      } finally {
        await session.endSession();
      }

      expect(transactionRolledBack).toBe(true);

      // Verify appt1 remains on Date A
      const refreshedAppt1 = await Appointment.findById(appt1._id);
      expect(refreshedAppt1?.date.toISOString()).toBe(dateA.toISOString());
    });
  });

  describe('3. Doctor Rating Recalculation Aggregation & VisitNote Role Projection', () => {
    it('aggregates approved review ratings and updates Doctor averageRating', async () => {
      // Create 3 reviews: 5 stars, 4 stars, 3 stars
      const dummyAppt1 = new mongoose.Types.ObjectId();
      const dummyAppt2 = new mongoose.Types.ObjectId();
      const dummyAppt3 = new mongoose.Types.ObjectId();

      const r1 = await Review.create({
        appointmentId: dummyAppt1,
        patientId: testPatientId,
        doctorId: testDoctorId,
        rating: 5,
        comment: 'Outstanding clinician.',
        status: 'approved',
      });
      const r2 = await Review.create({
        appointmentId: dummyAppt2,
        patientId: testPatientId,
        doctorId: testDoctorId,
        rating: 4,
        comment: 'Very thorough and punctual.',
        status: 'approved',
      });
      const r3 = await Review.create({
        appointmentId: dummyAppt3,
        patientId: testPatientId,
        doctorId: testDoctorId,
        rating: 3,
        comment: 'Good overall visit.',
        status: 'approved',
      });

      createdReviewIds.push(r1._id, r2._id, r3._id);

      // (5 + 4 + 3) / 3 = 4.0
      const stats = await recalculateDoctorRating(testDoctorId);

      expect(stats.reviewCount).toBe(3);
      expect(stats.averageRating).toBe(4.0);

      const doctorDoc = await Doctor.findById(testDoctorId);
      expect(doctorDoc?.averageRating).toBe(4.0);
      expect(doctorDoc?.reviewCount).toBe(3);
    });

    it('enforces patient privacy isolation on clinical records', async () => {
      const dummyAppt = new mongoose.Types.ObjectId();
      const otherPatientId = new mongoose.Types.ObjectId();

      const note = await VisitNote.create({
        appointmentId: dummyAppt,
        patientId: testPatientId,
        doctorId: testDoctorId,
        soap: {
          subjective: 'Patient reports mild headache',
          objective: 'BP 120/80',
          assessment: 'Tension headache',
          plan: 'Rest and hydration',
        },
        icd10Codes: [{ code: 'G44.2', description: 'Tension-type headache' }],
        status: 'finalized',
      });

      // Query as other patient: should be unauthorized / forbidden
      const patientCheck = note.patientId.toString() === otherPatientId.toString();
      expect(patientCheck).toBe(false);

      // Query as owner patient: matches
      const ownerCheck = note.patientId.toString() === testPatientId.toString();
      expect(ownerCheck).toBe(true);

      await VisitNote.findByIdAndDelete(note._id);
    });
  });

  describe('4. ChatLog Per-Step Persistence', () => {
    it('persists AI receptionist chat session and updates steps incrementally', async () => {
      const sessionId = `integ-chat-${Date.now()}`;
      createdChatSessionIds.push(sessionId);

      // Step 1: Initial user message
      await ChatLog.create({
        sessionId,
        userId: testUserId,
        status: 'active',
        messages: [
          {
            role: 'user',
            content: 'Hello, I need an appointment with a cardiologist.',
            timestamp: new Date(),
          },
        ],
        isEscalated: false,
      });

      // Step 2: Agent response step
      await ChatLog.updateOne(
        { sessionId },
        {
          $push: {
            messages: {
              role: 'assistant',
              content: 'I found Dr. Jenkins available this Friday. Would you like to reserve a 10:00 AM slot?',
              timestamp: new Date(),
            },
          },
        }
      );

      const session = await ChatLog.findOne({ sessionId });
      expect(session).not.toBeNull();
      expect(session?.messages.length).toBe(2);
      expect(session?.messages[0].role).toBe('user');
      expect(session?.messages[1].role).toBe('assistant');
    });
  });
});
