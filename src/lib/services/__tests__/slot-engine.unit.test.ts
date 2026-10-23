import { describe, it, expect } from 'vitest';
import { normalizeDateToUTC } from '../slot-engine';

describe('Slot Engine Unit Tests', () => {
  describe('normalizeDateToUTC', () => {
    it('should correctly normalize date strings to midnight UTC', () => {
      const normalized = normalizeDateToUTC('2026-11-15T14:32:00Z');
      expect(normalized.getUTCHours()).toBe(0);
      expect(normalized.getUTCMinutes()).toBe(0);
      expect(normalized.getUTCSeconds()).toBe(0);
      expect(normalized.getUTCFullYear()).toBe(2026);
      expect(normalized.getUTCMonth()).toBe(10); // 0-indexed November
      expect(normalized.getUTCDate()).toBe(15);
    });

    it('should normalize Date objects to midnight UTC', () => {
      const input = new Date('2026-05-01T23:59:59.999Z');
      const normalized = normalizeDateToUTC(input);
      expect(normalized.toISOString()).toBe('2026-05-01T00:00:00.000Z');
    });
  });

  describe('Slot Generation and Time Arithmetic', () => {
    function generateSlotRange(
      startTime: string,
      endTime: string,
      durationMinutes: number,
      breakWindow?: { start: string; end: string }
    ) {
      const toMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const toTime = (m: number) => {
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      };

      const start = toMins(startTime);
      const end = toMins(endTime);
      const breakStart = breakWindow ? toMins(breakWindow.start) : -1;
      const breakEnd = breakWindow ? toMins(breakWindow.end) : -1;

      const slots: Array<{ startTime: string; endTime: string }> = [];

      for (let cur = start; cur + durationMinutes <= end; cur += durationMinutes) {
        const slotEnd = cur + durationMinutes;
        // Exclude if overlapping break window
        if (breakWindow && !(slotEnd <= breakStart || cur >= breakEnd)) {
          continue;
        }
        slots.push({
          startTime: toTime(cur),
          endTime: toTime(slotEnd),
        });
      }

      return slots;
    }

    it('generates standard 30-minute consultation slots from 09:00 to 17:00 (16 slots)', () => {
      const slots = generateSlotRange('09:00', '17:00', 30);
      expect(slots.length).toBe(16);
      expect(slots[0]).toEqual({ startTime: '09:00', endTime: '09:30' });
      expect(slots[slots.length - 1]).toEqual({ startTime: '16:30', endTime: '17:00' });
    });

    it('excludes break window (12:00 to 13:00 lunch break)', () => {
      const slots = generateSlotRange('09:00', '17:00', 30, { start: '12:00', end: '13:00' });
      // 16 total - 2 lunch slots = 14 slots
      expect(slots.length).toBe(14);
      expect(slots.some((s) => s.startTime === '12:00')).toBe(false);
      expect(slots.some((s) => s.startTime === '12:30')).toBe(false);
      expect(slots.some((s) => s.startTime === '13:00')).toBe(true);
    });

    it('handles custom slot duration of 15 minutes', () => {
      const slots = generateSlotRange('09:00', '11:00', 15);
      // 2 hours * 4 = 8 slots
      expect(slots.length).toBe(8);
      expect(slots[0]).toEqual({ startTime: '09:00', endTime: '09:15' });
      expect(slots[1]).toEqual({ startTime: '09:15', endTime: '09:30' });
    });

    it('handles custom slot duration of 60 minutes', () => {
      const slots = generateSlotRange('10:00', '14:00', 60);
      expect(slots.length).toBe(4);
      expect(slots[0]).toEqual({ startTime: '10:00', endTime: '11:00' });
      expect(slots[3]).toEqual({ startTime: '13:00', endTime: '14:00' });
    });
  });

  describe('AbortSignal Cancellation Handling', () => {
    it('throws error when AbortSignal is pre-aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const { getAvailableSlotsForDate } = await import('../slot-engine');

      await expect(
        getAvailableSlotsForDate('507f1f77bcf86cd799439011', '2026-10-25', controller.signal)
      ).rejects.toThrow('Query aborted by caller');
    });
  });
});
