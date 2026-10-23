import { connectDB } from '@/lib/db';
import { ChatLog } from '@/models/ChatLog';

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: 'BUDGET_EXCEEDED' | 'RATE_LIMITED';
  message?: string;
  fallbackUrl?: string;
  currentDailySpendUsd?: number;
  dailyCapUsd?: number;
}

const DAILY_SPEND_CAP_USD = Number(process.env.AI_DAILY_SPEND_CAP_USD) || 50.0;
const RATE_LIMIT_MAX_PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 20;

// In-memory sliding window rate-limiter by patientId/IP
const patientMessageTimestamps = new Map<string, number[]>();

/**
 * Checks whether the clinic's daily AI budget has exceeded the cap,
 * or if a patient has triggered conversational rate limits.
 * Gracefully trips the circuit breaker to direct patients to the deterministic 5-step booking wizard.
 */
export async function checkClinicAIBudgetAndRateLimit(
  patientId?: string
): Promise<BudgetCheckResult> {
  const now = Date.now();

  // 1. Sliding window rate-limiting (per-patient or anonymous key)
  if (patientId) {
    const key = `rate-limit-${patientId}`;
    const windowStart = now - 60 * 1000;
    const timestamps = (patientMessageTimestamps.get(key) || []).filter((t) => t > windowStart);

    if (timestamps.length >= RATE_LIMIT_MAX_PER_MINUTE) {
      return {
        allowed: false,
        reason: 'RATE_LIMITED',
        message: 'Message rate limit exceeded. Please wait a moment before sending more messages, or use our direct online booking portal.',
        fallbackUrl: '/patient/book',
      };
    }

    timestamps.push(now);
    patientMessageTimestamps.set(key, timestamps);
  }

  // 2. Aggregate today's estimated AI token spend across all chat logs
  try {
    await connectDB();

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const spendStats = await ChatLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: { $size: '$messages' } },
        },
      },
    ]);

    // Approximate cost: ~$0.003 per turn (prompt + completion) for OpenAI gpt-4o / gpt-5.4
    const totalMessages = spendStats.length > 0 ? spendStats[0].totalMessages : 0;
    const estimatedDailySpendUsd = Math.round(totalMessages * 0.003 * 100) / 100;

    if (estimatedDailySpendUsd >= DAILY_SPEND_CAP_USD) {
      return {
        allowed: false,
        reason: 'BUDGET_EXCEEDED',
        message: 'The AI Receptionist has reached its daily assistance budget. Our direct online appointment booking system is fully operational.',
        fallbackUrl: '/patient/book',
        currentDailySpendUsd: estimatedDailySpendUsd,
        dailyCapUsd: DAILY_SPEND_CAP_USD,
      };
    }

    return {
      allowed: true,
      currentDailySpendUsd: estimatedDailySpendUsd,
      dailyCapUsd: DAILY_SPEND_CAP_USD,
    };
  } catch (error) {
    console.error('checkClinicAIBudgetAndRateLimit error:', error);
    // Fail-open for clinical availability unless catastrophic
    return {
      allowed: true,
      dailyCapUsd: DAILY_SPEND_CAP_USD,
    };
  }
}
