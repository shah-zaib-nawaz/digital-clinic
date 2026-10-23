import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { Doctor } from '@/models/Doctor';
import { Patient } from '@/models/Patient';
import { TelehealthSession } from '@/models/TelehealthSession';
import { signalingBus, emitTelehealthSignal } from '@/lib/telehealth/signaling-bus';
import { sendSignalSchemaCompiled } from '@/lib/validations/telehealth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');
    const role = searchParams.get('role') as 'doctor' | 'patient' | null;

    if (!appointmentId || !role) {
      return new Response('Missing appointmentId or role', { status: 400 });
    }

    await connectDB();
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return new Response('Appointment not found', { status: 404 });
    }

    // Role authorization check
    const userRole = (session.user as any).role;
    if (userRole === 'patient') {
      const patient = await Patient.findOne({ userId: session.user.id });
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return new Response('Unauthorized to access this telehealth room', { status: 403 });
      }
    } else if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId: session.user.id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return new Response('Unauthorized to access this telehealth room', { status: 403 });
      }
    }

    const encoder = new TextEncoder();
    let isClosed = false;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let onSignal: ((data: any) => void) | null = null;

    const eventKey = `signal:${appointmentId}:${role}`;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              appointmentId,
              role,
              connectedAt: new Date().toISOString(),
            })}\n\n`
          )
        );

        onSignal = (payload: any) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload.signal)}\n\n`));
          } catch (err) {
            console.error('Error enqueuing telehealth signal:', err);
          }
        };

        signalingBus.on(eventKey, onSignal);

        // Notify room that participant is listening
        const peerRole = role === 'doctor' ? 'patient' : 'doctor';
        emitTelehealthSignal({
          appointmentId,
          senderRole: role,
          targetRole: peerRole,
          signal: {
            type: 'participant-joined',
            senderName: session.user.name,
            timestamp: Date.now(),
          },
        });

        heartbeatTimer = setInterval(() => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          }
        }, 15000);

        req.signal.addEventListener('abort', () => {
          isClosed = true;
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (onSignal) {
            signalingBus.off(eventKey, onSignal);
          }
          // Notify peer that participant disconnected
          emitTelehealthSignal({
            appointmentId,
            senderRole: role,
            targetRole: peerRole,
            signal: {
              type: 'participant-left',
              senderName: session.user.name,
              timestamp: Date.now(),
            },
          });
          try {
            controller.close();
          } catch {
            // Stream already closed or cancelled by client
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Telehealth signal stream error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parseResult = sendSignalSchemaCompiled.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          fieldErrors: parseResult.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { appointmentId, targetRole, signal } = parseResult.data;
    const senderRole: 'doctor' | 'patient' = targetRole === 'doctor' ? 'patient' : 'doctor';

    // Broadcast in-memory to target peer
    emitTelehealthSignal({
      appointmentId,
      senderRole,
      targetRole,
      signal,
    });

    // Optionally persist SDP offer or answer for asynchronous reconnection recovery
    if (signal.type === 'offer' || signal.type === 'answer') {
      try {
        await connectDB();
        const updateField = signal.type === 'offer' ? { sdpOffer: signal.sdp } : { sdpAnswer: signal.sdp };
        await TelehealthSession.findOneAndUpdate(
          { appointmentId: new mongoose.Types.ObjectId(appointmentId) },
          { $set: updateField }
        );
      } catch (dbErr) {
        console.warn('Non-critical: Failed to cache SDP in session record:', dbErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Telehealth POST signal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
