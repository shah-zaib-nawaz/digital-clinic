import { describe, it, expect } from 'vitest';
import type { AppointmentStatus } from '../Appointment';

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  held: ['pending', 'confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [],
  cancelled: [],
  'no-show': [],
};

function isValidTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from];
  return Boolean(allowed && allowed.includes(to));
}

function checkCancellationEligibility(
  appointmentDateUTC: string,
  startTime: string,
  currentTimeMs: number = Date.now()
): { allowed: boolean; hoursUntilVisit: number; reason?: string } {
  const apptDateTime = new Date(appointmentDateUTC);
  const [h, m] = startTime.split(':').map(Number);
  apptDateTime.setUTCHours(h, m, 0, 0);

  const diffMs = apptDateTime.getTime() - currentTimeMs;
  const hoursUntilVisit = diffMs / (1000 * 60 * 60);

  if (hoursUntilVisit < 4) {
    return {
      allowed: false,
      hoursUntilVisit,
      reason: 'Appointments cannot be cancelled within 4 hours of the scheduled time. Please contact the clinic directly.',
    };
  }

  return { allowed: true, hoursUntilVisit };
}

describe('Appointment State Machine & Cancellation Rules', () => {
  describe('Legal State Transitions', () => {
    it('allows held -> pending', () => {
      expect(isValidTransition('held', 'pending')).toBe(true);
    });

    it('allows held -> confirmed', () => {
      expect(isValidTransition('held', 'confirmed')).toBe(true);
    });

    it('allows held -> cancelled', () => {
      expect(isValidTransition('held', 'cancelled')).toBe(true);
    });

    it('allows pending -> confirmed', () => {
      expect(isValidTransition('pending', 'confirmed')).toBe(true);
    });

    it('allows pending -> cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true);
    });

    it('allows confirmed -> completed', () => {
      expect(isValidTransition('confirmed', 'completed')).toBe(true);
    });

    it('allows confirmed -> cancelled', () => {
      expect(isValidTransition('confirmed', 'cancelled')).toBe(true);
    });

    it('allows confirmed -> no-show', () => {
      expect(isValidTransition('confirmed', 'no-show')).toBe(true);
    });

    it('allows identical status transition (no-op)', () => {
      expect(isValidTransition('confirmed', 'confirmed')).toBe(true);
    });
  });

  describe('Illegal State Transitions', () => {
    it('blocks completed -> confirmed', () => {
      expect(isValidTransition('completed', 'confirmed')).toBe(false);
    });

    it('blocks completed -> cancelled', () => {
      expect(isValidTransition('completed', 'cancelled')).toBe(false);
    });

    it('blocks completed -> held', () => {
      expect(isValidTransition('completed', 'held')).toBe(false);
    });

    it('blocks cancelled -> confirmed', () => {
      expect(isValidTransition('cancelled', 'confirmed')).toBe(false);
    });

    it('blocks cancelled -> completed', () => {
      expect(isValidTransition('cancelled', 'completed')).toBe(false);
    });

    it('blocks no-show -> confirmed', () => {
      expect(isValidTransition('no-show', 'confirmed')).toBe(false);
    });

    it('blocks held -> completed (must be confirmed first)', () => {
      expect(isValidTransition('held', 'completed')).toBe(false);
    });

    it('blocks pending -> completed (must be confirmed first)', () => {
      expect(isValidTransition('pending', 'completed')).toBe(false);
    });
  });

  describe('4-Hour Cancellation Cutoff Policy', () => {
    it('allows cancellation when requested 24 hours before visit', () => {
      const apptDate = '2026-11-20T00:00:00.000Z';
      const startTime = '10:00';
      // Target: 2026-11-20 10:00 UTC
      // Current: 2026-11-19 10:00 UTC (24h before)
      const now = new Date('2026-11-19T10:00:00.000Z').getTime();

      const result = checkCancellationEligibility(apptDate, startTime, now);
      expect(result.allowed).toBe(true);
      expect(result.hoursUntilVisit).toBeCloseTo(24);
    });

    it('allows cancellation when requested 4.5 hours before visit', () => {
      const apptDate = '2026-11-20T00:00:00.000Z';
      const startTime = '14:00';
      // Target: 2026-11-20 14:00 UTC
      // Current: 2026-11-20 09:30 UTC (4.5h before)
      const now = new Date('2026-11-20T09:30:00.000Z').getTime();

      const result = checkCancellationEligibility(apptDate, startTime, now);
      expect(result.allowed).toBe(true);
      expect(result.hoursUntilVisit).toBeCloseTo(4.5);
    });

    it('blocks cancellation when requested 2 hours before visit (< 4h threshold)', () => {
      const apptDate = '2026-11-20T00:00:00.000Z';
      const startTime = '14:00';
      // Target: 2026-11-20 14:00 UTC
      // Current: 2026-11-20 12:00 UTC (2h before)
      const now = new Date('2026-11-20T12:00:00.000Z').getTime();

      const result = checkCancellationEligibility(apptDate, startTime, now);
      expect(result.allowed).toBe(false);
      expect(result.hoursUntilVisit).toBeCloseTo(2);
      expect(result.reason).toContain('within 4 hours');
    });

    it('blocks cancellation when appointment has already passed', () => {
      const apptDate = '2026-11-20T00:00:00.000Z';
      const startTime = '10:00';
      const now = new Date('2026-11-20T11:00:00.000Z').getTime(); // 1h after

      const result = checkCancellationEligibility(apptDate, startTime, now);
      expect(result.allowed).toBe(false);
      expect(result.hoursUntilVisit).toBeLessThan(0);
    });
  });
});
