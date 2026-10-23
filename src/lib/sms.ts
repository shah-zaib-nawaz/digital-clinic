import twilio from 'twilio';

const enableTwilio = process.env.ENABLE_TWILIO_SMS === 'true';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;

const client =
  enableTwilio && accountSid && authToken && !accountSid.startsWith('placeholder') && !accountSid.startsWith('your-')
    ? twilio(accountSid, authToken)
    : null;

export interface SendClinicSmsOptions {
  to: string;
  body: string;
}

export interface SendClinicSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendClinicSMS({
  to,
  body,
}: SendClinicSmsOptions): Promise<SendClinicSmsResult> {
  try {
    if (!enableTwilio || !client || !twilioFromNumber) {
      console.log(`[DEV SMS DISPATCHER] 📱 To: ${to} | Body: "${body}"`);
      return {
        success: true,
        sid: `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
    }

    const message = await client.messages.create({
      body,
      from: twilioFromNumber,
      to,
    });

    return {
      success: true,
      sid: message.sid,
    };
  } catch (error) {
    console.error('sendClinicSMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS dispatch error',
    };
  }
}
