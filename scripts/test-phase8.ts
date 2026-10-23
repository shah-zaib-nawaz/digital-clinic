import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../src/lib/db';
import { Doctor } from '../src/models/Doctor';
import { Patient } from '../src/models/Patient';
import { Appointment } from '../src/models/Appointment';
import { TelehealthSession } from '../src/models/TelehealthSession';
import {
  joinSessionSchemaCompiled,
  sendSignalSchemaCompiled,
  concludeSessionSchemaCompiled,
} from '../src/lib/validations/telehealth';
import {
  signalingBus,
  emitTelehealthSignal,
} from '../src/lib/telehealth/signaling-bus';

async function runPhase8Tests() {
  console.log('📹 Starting Phase 8 Telehealth Video & WebRTC Infrastructure Harness...\n');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas Replica Set.');

    // 1. Locate Doctor and Patient
    const doctor = await Doctor.findOne().populate('userId');
    const patient = await Patient.findOne().populate('userId');

    if (!doctor || !patient) {
      throw new Error('Doctor or Patient not found in database. Run seed first.');
    }
    console.log(`👨‍⚕️ Clinician: Dr. ${(doctor.userId as any)?.name} (${doctor._id})`);
    console.log(`👤 Patient: ${(patient.userId as any)?.name} (${patient._id})`);

    // 2. Locate or create an encounter appointment
    let appointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      status: { $in: ['confirmed', 'completed'] },
    });

    if (!appointment) {
      appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: doctor.departmentId,
        date: new Date(),
        startTime: '16:00',
        endTime: '16:30',
        status: 'confirmed',
        chiefComplaint: 'Telehealth consultation for seasonal allergic rhinitis',
        attachmentUrls: [],
        consultationFeeSnapshot: (doctor as any).consultationFee || 150,
      });
      console.log(`📅 Created test encounter appointment: ${appointment._id}`);
    } else {
      console.log(`📅 Using encounter appointment: ${appointment._id}`);
    }

    const appointmentIdStr = appointment._id.toString();

    // 3. Test Zod 4 Schema Validation with z.compile
    console.log('\n--- Test 1: Zod 4 Schema Validation & JIT Compilation ---');
    const validSignal = {
      appointmentId: appointmentIdStr,
      targetRole: 'patient' as const,
      signal: {
        type: 'offer' as const,
        sdp: { type: 'offer', sdp: 'v=0\r\no=- 20518 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' },
        senderName: 'Dr. Marcus Vance',
        timestamp: Date.now(),
      },
    };

    const signalParse = sendSignalSchemaCompiled.safeParse(validSignal);
    if (!signalParse.success) {
      throw new Error(`sendSignalSchemaCompiled failed: ${JSON.stringify(signalParse.error)}`);
    }
    console.log('✅ WebRTC offer signal parsed and validated cleanly.');

    const joinParse = joinSessionSchemaCompiled.safeParse({ appointmentId: appointmentIdStr });
    if (!joinParse.success) {
      throw new Error('joinSessionSchemaCompiled failed');
    }
    console.log('✅ Join session schema compiled and validated.');

    const concludeParse = concludeSessionSchemaCompiled.safeParse({
      appointmentId: appointmentIdStr,
      notesSummary: 'Prescribed antihistamines and nasal spray.',
    });
    if (!concludeParse.success) {
      throw new Error('concludeSessionSchemaCompiled failed');
    }
    console.log('✅ Conclude session schema compiled and validated.');

    // 4. Test TelehealthSession Creation & Lifecycle
    console.log('\n--- Test 2: TelehealthSession Lifecycle & Participant Attendance ---');
    await TelehealthSession.deleteMany({ appointmentId: appointment._id });

    const roomName = `room_${appointmentIdStr}`;
    const sessionDoc = await TelehealthSession.create({
      appointmentId: appointment._id,
      doctorId: doctor._id,
      patientId: patient._id,
      roomName,
      status: 'waiting',
      doctorJoined: true,
      patientJoined: false,
    });

    console.log(`✅ TelehealthSession created: ID = ${sessionDoc._id} | Status = ${sessionDoc.status}`);
    if (sessionDoc.status !== 'waiting' || !sessionDoc.doctorJoined || sessionDoc.patientJoined) {
      throw new Error('Initial session state does not match expected waiting flags');
    }

    // Patient enters consultation room
    sessionDoc.patientJoined = true;
    sessionDoc.status = 'in-progress';
    sessionDoc.startedAt = new Date(Date.now() - 15000); // Simulated 15 seconds ago
    await sessionDoc.save();

    console.log(`✅ Patient joined room: Status transitioned to '${sessionDoc.status}' | startedAt set.`);
    if (sessionDoc.status !== 'in-progress' || !sessionDoc.startedAt) {
      throw new Error('Failed to transition session to in-progress upon patient join');
    }

    // 5. Test WebRTC Signaling Bus In-Memory Exchange
    console.log('\n--- Test 3: WebRTC In-Memory Signaling Bus Event Exchange ---');
    let signalReceived: any = null;
    const testChannel = `signal:${appointmentIdStr}:patient`;

    const listener = (payload: any) => {
      signalReceived = payload;
    };
    signalingBus.once(testChannel, listener);

    emitTelehealthSignal({
      appointmentId: appointmentIdStr,
      senderRole: 'doctor',
      targetRole: 'patient',
      signal: {
        type: 'ice-candidate',
        candidate: { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.1 5000 typ host', sdpMid: '0' },
        senderName: 'Dr. Marcus Vance',
        timestamp: Date.now(),
      },
    });

    if (!signalReceived || signalReceived.signal.type !== 'ice-candidate') {
      throw new Error('Signaling bus failed to deliver ICE candidate to target subscriber');
    }
    console.log(`✅ Signaling bus successfully delivered '${signalReceived.signal.type}' to target peer.`);

    // 6. Test Concluding Telehealth Consultation
    console.log('\n--- Test 4: Conclude Telehealth Consultation & Duration Calculation ---');
    const now = new Date();
    const durationSeconds = Math.round((now.getTime() - sessionDoc.startedAt.getTime()) / 1000);

    sessionDoc.status = 'concluded';
    sessionDoc.endedAt = now;
    sessionDoc.durationSeconds = durationSeconds;
    sessionDoc.notesSummary = 'Patient responded well to clinical visual triage. Medication prescribed.';
    await sessionDoc.save();

    const verifiedConcluded = await TelehealthSession.findById(sessionDoc._id);
    if (
      verifiedConcluded?.status !== 'concluded' ||
      !verifiedConcluded.endedAt ||
      verifiedConcluded.durationSeconds < 1
    ) {
      throw new Error('Telehealth session conclusion metrics failed to persist');
    }
    console.log(`✅ Session concluded: Duration = ${verifiedConcluded.durationSeconds}s | Summary = "${verifiedConcluded.notesSummary}"`);

    // 7. Test Mongoose 9.11 Soft Delete on TelehealthSession
    console.log('\n--- Test 5: Mongoose 9.11 Soft Delete Plugin on TelehealthSession ---');
    await sessionDoc.softDelete();
    const hiddenCheck = await TelehealthSession.findById(sessionDoc._id);
    if (hiddenCheck !== null) {
      throw new Error('Soft-deleted telehealth session was not filtered out from standard queries');
    }
    console.log('✅ Soft-deleted telehealth session is filtered out from standard queries (returned null).');

    await sessionDoc.restore();
    const restoredCheck = await TelehealthSession.findById(sessionDoc._id);
    if (!restoredCheck || restoredCheck.isDeleted) {
      throw new Error('Restore failed to bring telehealth session back to active queries');
    }
    console.log('✅ Telehealth session successfully restored (isDeleted: false).');

    console.log('\n🎉 ALL PHASE 8 TELEHEALTH & WEBRTC TESTS PASSED CLEANLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 8 Verification Test Failed:', err);
    process.exit(1);
  }
}

runPhase8Tests();
