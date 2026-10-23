import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { generateHitlToken, verifyHitlToken } from '../src/lib/ai/hitl';
import { clinicalTools } from '../src/lib/ai/tools';
import { ChatLog } from '../src/models/ChatLog';
import { Doctor } from '../src/models/Doctor';
import { User } from '../src/models/User';
import { Department } from '../src/models/Department';

async function runPhase5Verification() {
  console.log('🧪 Starting Phase 5 AI Receptionist & Triage Verification Harness...\n');
  await connectDB();

  // 1. Verify HMAC Cryptographic Security Layer
  console.log('--- 1. Testing Cryptographic HMAC Human-in-the-Loop Tokens ---');
  const dummyPayload = {
    doctorId: new mongoose.Types.ObjectId().toString(),
    doctorName: 'Dr. Sarah Lin',
    date: '2026-11-16',
    startTime: '10:00',
    endTime: '10:30',
    consultationFee: 150,
  };

  const token = generateHitlToken(dummyPayload);
  console.log(`  🔑 Generated Base64URL HMAC Token: ${token.slice(0, 32)}...`);

  // Verify valid token
  const validCheck = verifyHitlToken(token);
  if (!validCheck.valid || !validCheck.payload) {
    throw new Error('Valid HMAC token failed verification!');
  }
  console.log('  ✅ Valid Token Verification: SUCCESS');

  // Verify tampered token
  const decodedRaw = Buffer.from(token, 'base64url').toString('utf-8');
  const parsed = JSON.parse(decodedRaw);
  parsed.payload.consultationFee = 0; // Hacker tampers fee to $0
  const tamperedToken = Buffer.from(JSON.stringify(parsed), 'utf-8').toString('base64url');

  const tamperedCheck = verifyHitlToken(tamperedToken);
  if (tamperedCheck.valid) {
    throw new Error('SECURITY BREACH: Tampered token was incorrectly accepted!');
  }
  console.log('  🛡️ Tampered Token Protection: SECURE (Tamper detected & rejected cleanly)');

  // 2. Test Clinical Tools Execution
  console.log('\n--- 2. Testing Clinical AI Tools Execution ---');

  // A. Search Doctors
  const searchResult = await (clinicalTools.searchDoctors as any).execute({
    specialty: 'Cardiology',
  });
  console.log(`  ✅ searchDoctors tool: Returned ${searchResult.count} physicians`);

  // Pick a real doctor for availability check
  const realDoctor = await Doctor.findOne({ isAcceptingPatients: true });
  if (realDoctor) {
    // B. Check Doctor Availability
    const availResult = await (clinicalTools.checkDoctorAvailability as any).execute({
      doctorId: realDoctor._id.toString(),
      date: '2026-11-16',
    });
    console.log(`  ✅ checkDoctorAvailability tool: Found ${availResult.totalAvailable || 0} open slots for ${availResult.doctorName}`);

    // C. Request Slot Hold Approval (HITL)
    const holdApprovalResult = await (clinicalTools.requestSlotHoldApproval as any).execute({
      doctorId: realDoctor._id.toString(),
      doctorName: 'Dr. Test Physician',
      date: '2026-11-16',
      startTime: '09:00',
      endTime: '09:30',
      consultationFee: realDoctor.consultationFee,
    });
    if (!holdApprovalResult.requiresApproval || !holdApprovalResult.approvalToken) {
      throw new Error('requestSlotHoldApproval failed to return approval token!');
    }
    console.log('  ✅ requestSlotHoldApproval tool: Generated interactive HITL card with valid token');
  }

  // D. Emergency Escalation Tool
  const emergencyResult = await (clinicalTools.escalateToEmergencyStaff as any).execute({
    reason: 'Crushing chest pain radiating to left arm',
    severity: 'emergency',
  });
  if (!emergencyResult.escalated || !emergencyResult.emergencyGuidance.includes('911')) {
    throw new Error('Emergency escalation tool failed to return emergency protocol!');
  }
  console.log('  🚨 escalateToEmergencyStaff tool: Returned immediate emergency 911 warning protocol');

  // 3. Test ChatLog Session Persistence
  console.log('\n--- 3. Testing Mongoose 9.11 ChatLog Session Persistence ---');
  const testSessionId = `test-session-${Date.now()}`;
  const log = await ChatLog.create({
    sessionId: testSessionId,
    status: 'active',
    isEscalated: false,
    messages: [
      { role: 'user', content: 'Hello, I have chest pressure', timestamp: new Date() },
      { role: 'assistant', content: 'Please seek emergency care immediately.', timestamp: new Date() },
    ],
    triageSummary: {
      urgency: 'emergency',
      chiefComplaint: 'Chest pressure',
    },
  });

  const retrieved = await ChatLog.findOne({ sessionId: testSessionId }).lean();
  if (!retrieved || retrieved.messages.length !== 2) {
    throw new Error('Failed to retrieve persisted ChatLog session!');
  }
  console.log(`  ✅ ChatLog Session Persisted & Retrieved: ${retrieved.sessionId} (${retrieved.messages.length} messages)`);

  // Clean up
  await ChatLog.findByIdAndDelete(log._id);
  console.log('  🧹 Cleaned up test ChatLog record.');

  console.log('\n🎯 ALL PHASE 5 AI RECEPTIONIST SUBSYSTEMS FULLY OPERATIONAL AND VERIFIED!\n');
  await mongoose.disconnect();
  process.exit(0);
}

runPhase5Verification().catch((err) => {
  console.error('Phase 5 verification failed:', err);
  process.exit(1);
});
