import { NextRequest, NextResponse } from 'next/server';
import * as React from 'react';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/models/Appointment';
import { normalizeDateToUTC } from '@/lib/services/slot-engine';
import { sendClinicEmail } from '@/lib/email';
import { AppointmentReminderEmail } from '@/emails/appointment-reminder';
import { createAndBroadcastNotification } from '@/lib/notification-bus';
import { sendClinicSMS } from '@/lib/sms';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify authorization secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const querySecret = req.nextUrl.searchParams.get('secret');

    const isAuthorized =
      !cronSecret ||
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret ||
      process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    await connectDB();

    // 2. Determine target date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = normalizeDateToUTC(tomorrow);

    // 3. Find confirmed appointments for tomorrow
    const appointments = await Appointment.find({
      date: targetDate,
      status: 'confirmed',
      isDeleted: false,
    })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'departmentId', select: 'name' },
        ],
      })
      .lean<any[]>();

    let sentCount = 0;
    const results: Array<{ id: string; emailSent: boolean; sseSent: boolean; smsSent: boolean }> = [];

    const dateFormatted = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    for (const appt of appointments) {
      const patientUser = appt.patientId?.userId;
      const doctorUser = appt.doctorId?.userId;

      const timeWindow = `${appt.startTime} - ${appt.endTime}`;
      let emailSent = false;
      let sseSent = false;
      let smsSent = false;

      // A. Send Reminder Email
      if (patientUser?.email) {
        const emailResult = await sendClinicEmail({
          to: patientUser.email,
          subject: `Reminder: Tomorrow's Consultation with Dr. ${doctorUser?.name || 'Physician'} at ${appt.startTime}`,
          react: React.createElement(AppointmentReminderEmail, {
            patientName: patientUser.name || 'Valued Patient',
            doctorName: `Dr. ${doctorUser?.name || 'Physician'}`,
            specialization: appt.doctorId?.specialization || 'Clinical Care',
            date: `Tomorrow (${dateFormatted})`,
            timeWindow,
            portalUrl: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/patient/appointments`,
          }),
          idempotencyKey: `reminder-cron-${appt._id.toString()}-${targetDate.toISOString().split('T')[0]}`,
        });
        emailSent = emailResult.success;
      }

      // B. In-App Notification & SSE Push
      if (patientUser?._id) {
        try {
          await createAndBroadcastNotification({
            userId: patientUser._id.toString(),
            type: 'REMINDER',
            title: 'Consultation Reminder',
            message: `Reminder: You have a scheduled appointment tomorrow at ${timeWindow} with Dr. ${doctorUser?.name || 'Physician'}.`,
            actionUrl: '/patient/appointments',
          });
          sseSent = true;
        } catch (err) {
          console.error('Failed to create reminder notification:', err);
        }
      }

      // C. Optional Twilio SMS
      if (patientUser?.phone) {
        const smsResult = await sendClinicSMS({
          to: patientUser.phone,
          body: `Reminder: Your consultation with Dr. ${doctorUser?.name || 'Physician'} is tomorrow at ${appt.startTime}. Portal: ${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/patient/appointments`,
        });
        smsSent = smsResult.success;
      }

      if (emailSent || sseSent || smsSent) {
        sentCount++;
      }

      results.push({
        id: appt._id.toString(),
        emailSent,
        sseSent,
        smsSent,
      });
    }

    return NextResponse.json({
      success: true,
      targetDate: targetDate.toISOString().split('T')[0],
      totalAppointmentsFound: appointments.length,
      remindersDispatched: sentCount,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED' || error?.digest === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Reminders cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown cron error',
      },
      { status: 500 }
    );
  }
}
