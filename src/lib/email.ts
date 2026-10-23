import { Resend } from 'resend';
import * as React from 'react';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'Digital Clinic <notifications@digitalclinic.test>';

export const resend = resendApiKey && !resendApiKey.startsWith('re_placeholder') && resendApiKey !== 're_...'
  ? new Resend(resendApiKey)
  : null;

export interface SendClinicEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export async function sendClinicEmail({
  to,
  subject,
  react,
  idempotencyKey,
  signal,
}: SendClinicEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (signal?.aborted) {
      throw new Error('Email sending aborted by signal');
    }

    const recipients = Array.isArray(to) ? to : [to];

    // Development or Missing API key fallback
    if (!resend) {
      console.log(`[DEV EMAIL DISPATCHER] 📨 To: ${recipients.join(', ')} | Subject: "${subject}" | IdempotencyKey: ${idempotencyKey || 'none'}`);
      return {
        success: true,
        id: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const effectiveFrom =
      emailFrom.includes('yourdomain.com') || emailFrom.includes('digitalclinic.test')
        ? 'Digital Clinic <onboarding@resend.dev>'
        : emailFrom;

    const response = await resend.emails.send({
      from: effectiveFrom,
      to: recipients,
      subject,
      react,
      headers,
    });

    if (response.error) {
      // In development or when domain is unverified, log and return dev mock ID
      if (
        process.env.NODE_ENV !== 'production' &&
        (response.error.message.includes('not verified') ||
          response.error.message.includes('validation_error') ||
          response.error.message.includes('own email address') ||
          response.error.message.includes('verify a domain') ||
          response.error.message.includes('testing emails'))
      ) {
        console.log(
          `[DEV RESEND FALLBACK] 📨 Resend test mode notice. Logged to console instead.\nTo: ${recipients.join(', ')} | Subject: "${subject}"`
        );
        return {
          success: true,
          id: `mock-resend-fallback-${Date.now()}`,
        };
      }
      console.error('Resend API returned error:', response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (error) {
    console.error('sendClinicEmail error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email dispatch failure',
    };
  }
}
