/**
 * High-Concurrency Booking Engine Stress Test
 * Simulates 10 concurrent patient checkout requests attempting to hold the EXACT SAME slot simultaneously.
 * Validates:
 * 1. Exactly 1 request acquires the 5-minute hold lock.
 * 2. Exactly 9 requests are rejected with 'SLOT_TAKEN'.
 * 3. Zero double-booking collision is guaranteed at the database engine level.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { Doctor } from '../src/models/Doctor';
import { Patient } from '../src/models/Patient';
import { Appointment } from '../src/models/Appointment';
import { normalizeDateToUTC } from '../src/lib/services/slot-engine';

async function runConcurrencyStressTest() {
  console.log('⚡ Starting 10-Thread Concurrent Slot Lock Stress Test...\n');
  await connectDB();

  // 1. Pick a test doctor and test patients
  const doctor = await Doctor.findOne({ isAcceptingPatients: true });
  if (!doctor) {
    throw new Error('No doctor available for testing');
  }

  const patients = await Patient.find({}).limit(10);
  if (patients.length < 2) {
    throw new Error('Need at least 2 patients seeded for concurrency test');
  }

  const testDate = normalizeDateToUTC('2026-11-15');
  const testStartTime = '14:30';
  const testEndTime = '15:00';

  // Clean any previous test artifacts for this slot
  await Appointment.deleteMany({
    doctorId: doctor._id,
    date: testDate,
    startTime: testStartTime,
  });

  console.log(`🎯 Target Physician: ${doctor.specialization}`);
  console.log(`📅 Target Slot: ${testDate.toISOString().split('T')[0]} at ${testStartTime} - ${testEndTime}`);
  console.log(`👥 Simulating ${patients.length} concurrent patient requests hitting the slot at the same millisecond...\n`);

  // Launch 10 simultaneous hold attempts
  const results = await Promise.allSettled(
    patients.map(async (patient, idx) => {
      try {
        const heldUntil = new Date(Date.now() + 5 * 60 * 1000);
        const appt = await Appointment.create({
          patientId: patient._id,
          doctorId: doctor._id,
          departmentId: doctor.departmentId,
          date: testDate,
          startTime: testStartTime,
          endTime: testEndTime,
          status: 'held',
          heldUntil,
          chiefComplaint: `Concurrent Test Attempt #${idx + 1}`,
          consultationFeeSnapshot: doctor.consultationFee,
        });
        return { success: true, appointmentId: appt._id.toString(), patientIdx: idx + 1 };
      } catch (err: any) {
        if (err.code === 11000) {
          return { success: false, code: 'SLOT_TAKEN', patientIdx: idx + 1 };
        }
        return { success: false, error: err.message, patientIdx: idx + 1 };
      }
    })
  );

  let successCount = 0;
  let slotTakenCount = 0;
  let otherErrorCount = 0;

  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      const val = res.value;
      if (val.success) {
        successCount++;
        console.log(`  Thread #${val.patientIdx}: ✅ SUCCESS - Slot lock acquired (Appt ID: ${val.appointmentId})`);
      } else if (val.code === 'SLOT_TAKEN') {
        slotTakenCount++;
        console.log(`  Thread #${val.patientIdx}: 🔒 REJECTED - SLOT_TAKEN (Compound unique partial index prevented collision)`);
      } else {
        otherErrorCount++;
        console.log(`  Thread #${val.patientIdx}: ❌ ERROR - ${val.error}`);
      }
    }
  });

  console.log('\n📊 Concurrency Stress Test Results:');
  console.log(`  - Total Threads: ${results.length}`);
  console.log(`  - Acquired Locks: ${successCount}`);
  console.log(`  - Protected Collisions (SLOT_TAKEN): ${slotTakenCount}`);
  console.log(`  - Unexpected Failures: ${otherErrorCount}`);

  // Assertions
  if (successCount === 1 && slotTakenCount === results.length - 1 && otherErrorCount === 0) {
    console.log('\n🎉 PASS: Perfect concurrency isolation! Zero double-booking vulnerability confirmed at MongoDB kernel level.');
  } else {
    console.error('\n❌ FAIL: Concurrency violation detected.');
    process.exit(1);
  }

  // Cleanup test hold
  await Appointment.deleteMany({
    doctorId: doctor._id,
    date: testDate,
    startTime: testStartTime,
  });

  process.exit(0);
}

runConcurrencyStressTest().catch((err) => {
  console.error('Fatal concurrency test error:', err);
  process.exit(1);
});
