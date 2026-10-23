'use server';

import { ensureSession } from '@/lib/session';
import { verifyHitlToken } from '@/lib/ai/hitl';
import { holdAppointmentSlotAction, ActionResponse } from '@/actions/appointment.actions';
import { connectDB } from '@/lib/db';
import { ChatLog } from '@/models/ChatLog';
import { AppointmentLean } from '@/models/Appointment';

export interface ExecuteApprovedSlotHoldInput {
  approvalToken: string;
  chiefComplaint?: string;
  sessionId?: string;
}

export async function executeApprovedSlotHoldAction(
  input: ExecuteApprovedSlotHoldInput
): Promise<ActionResponse<AppointmentLean>> {
  try {
    // 1. Authenticate user
    const session = await ensureSession(['patient', 'admin', 'superadmin']);

    // 2. Cryptographic signature and expiry verification
    const verification = verifyHitlToken(input.approvalToken);
    if (!verification.valid || !verification.payload) {
      return {
        success: false,
        error: verification.error || 'INVALID_APPROVAL_TOKEN: Token verification failed',
      };
    }

    const { doctorId, date, startTime, endTime } = verification.payload;

    // 3. Delegate to core slot hold action with database concurrency checks
    const result = await holdAppointmentSlotAction({
      doctorId,
      date,
      startTime,
      endTime,
      chiefComplaint: input.chiefComplaint || 'Booked through AI Receptionist Triage',
    });

    if (!result.success) {
      return result;
    }

    // 4. Update ChatLog session status if sessionId provided
    if (input.sessionId) {
      try {
        await connectDB();
        await ChatLog.updateOne(
          { sessionId: input.sessionId },
          {
            $set: {
              status: 'completed',
              userId: session.user.id,
              'triageSummary.chiefComplaint': input.chiefComplaint,
            },
          }
        );
      } catch (logErr) {
        console.error('Failed to update ChatLog session status:', logErr);
      }
    }

    return result;
  } catch (error) {
    console.error('executeApprovedSlotHoldAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute approved slot hold',
    };
  }
}
