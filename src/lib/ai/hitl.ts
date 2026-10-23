import { createHmac, timingSafeEqual } from 'crypto';

const HMAC_SECRET =
  process.env.AI_HMAC_SECRET || 'dev-hmac-secret-at-least-32-chars-long-clinic-ai-token';

export interface HitlSlotHoldPayload {
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  userId?: string;
  timestamp: number;
}

export function generateHitlToken(payload: Omit<HitlSlotHoldPayload, 'timestamp'>): string {
  const fullPayload: HitlSlotHoldPayload = {
    ...payload,
    timestamp: Date.now(),
  };

  const serialized = JSON.stringify(fullPayload);
  const signature = createHmac('sha256', HMAC_SECRET).update(serialized).digest('hex');

  const tokenContainer = {
    payload: fullPayload,
    signature,
  };

  return Buffer.from(JSON.stringify(tokenContainer), 'utf-8').toString('base64url');
}

export interface VerifyHitlTokenResult {
  valid: boolean;
  payload?: HitlSlotHoldPayload;
  error?: string;
}

export function verifyHitlToken(token: string): VerifyHitlTokenResult {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token missing or malformed' };
    }

    const decodedRaw = Buffer.from(token, 'base64url').toString('utf-8');
    const { payload, signature } = JSON.parse(decodedRaw);

    if (!payload || !signature) {
      return { valid: false, error: 'Invalid token structure' };
    }

    // 1. Validate Expiry (10 minutes)
    const MAX_AGE_MS = 10 * 60 * 1000;
    if (Date.now() - payload.timestamp > MAX_AGE_MS) {
      return { valid: false, error: 'TOKEN_EXPIRED: Approval token has expired (10m limit)' };
    }

    // 2. Validate HMAC Cryptographic Signature with constant-time equality
    const expectedSig = createHmac('sha256', HMAC_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return { valid: false, error: 'TOKEN_TAMPERED: HMAC cryptographic signature mismatch' };
    }

    return { valid: true, payload };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown token verification failure',
    };
  }
}
