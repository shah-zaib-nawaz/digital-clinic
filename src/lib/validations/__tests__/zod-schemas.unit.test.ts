import { describe, it, expect } from 'vitest';
import {
  holdSlotSchemaCompiled,
  confirmHeldAppointmentSchemaCompiled,
  cancelAppointmentSchemaCompiled,
  rescheduleAppointmentSchemaCompiled,
} from '../appointment';
import { encryptField, decryptField } from '../../security/csfle-helper';

describe('Zod 4.6.7 Schemas & CSFLE Encryption Suite', () => {
  describe('Zod Appointment Schemas', () => {
    it('validates a correct holdSlot input', () => {
      const valid = {
        doctorId: '60d0fe4f5311236168a109ca',
        date: '2026-11-05',
        startTime: '09:30',
        endTime: '10:00',
        chiefComplaint: 'Annual cardiac screening',
        attachmentUrls: ['https://res.cloudinary.com/clinic/sample.pdf'],
      };

      const result = holdSlotSchemaCompiled.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.doctorId).toBe('60d0fe4f5311236168a109ca');
        expect(result.data.date).toBe('2026-11-05');
      }
    });

    it('rejects invalid date format in holdSlot', () => {
      const invalid = {
        doctorId: '60d0fe4f5311236168a109ca',
        date: '05-11-2026', // Should be YYYY-MM-DD
        startTime: '09:30',
        endTime: '10:00',
      };

      const result = holdSlotSchemaCompiled.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid time format in holdSlot', () => {
      const invalid = {
        doctorId: '60d0fe4f5311236168a109ca',
        date: '2026-11-05',
        startTime: '9:30', // Missing leading zero
        endTime: '25:00', // Invalid hour
      };

      const result = holdSlotSchemaCompiled.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates confirmHeldAppointment schema', () => {
      const valid = {
        appointmentId: '60d0fe4f5311236168a109cb',
        chiefComplaint: 'Routine follow-up',
      };

      const result = confirmHeldAppointmentSchemaCompiled.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty appointmentId in confirmHeldAppointment', () => {
      const invalid = {
        appointmentId: '',
      };

      const result = confirmHeldAppointmentSchemaCompiled.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates cancelAppointment schema with min 3 char reason', () => {
      const valid = {
        appointmentId: '60d0fe4f5311236168a109cb',
        reason: 'Work schedule conflict',
      };

      const result = cancelAppointmentSchemaCompiled.safeParse(valid);
      expect(result.success).toBe(true);

      const tooShort = {
        appointmentId: '60d0fe4f5311236168a109cb',
        reason: 'No',
      };
      expect(cancelAppointmentSchemaCompiled.safeParse(tooShort).success).toBe(false);
    });

    it('validates rescheduleAppointment schema', () => {
      const valid = {
        appointmentId: '60d0fe4f5311236168a109cb',
        newDoctorId: '60d0fe4f5311236168a109ca',
        newDate: '2026-11-12',
        newStartTime: '14:00',
        newEndTime: '14:30',
        reason: 'Doctor requested time change',
      };

      const result = rescheduleAppointmentSchemaCompiled.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('CSFLE AES-256-GCM Field Encryption Round-Trips', () => {
    const SECRET_KEY = 'super-secret-clinic-encryption-key-for-hipaa-compliance';

    it('encrypts sensitive clinical string and decrypts to exact original value', () => {
      const sensitiveSSN = '123-45-6789-HIPAA-PROTECTED';
      const encrypted = encryptField(sensitiveSSN, SECRET_KEY);

      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(sensitiveSSN);
      expect(encrypted.split(':').length).toBe(3); // iv:tag:ciphertext

      const decrypted = decryptField(encrypted, SECRET_KEY);
      expect(decrypted).toBe(sensitiveSSN);
    });

    it('produces distinct ciphertexts for identical plaintext (random IV)', () => {
      const data = 'Patient diagnostic allergy profile: Penicillin anaphylaxis';
      const enc1 = encryptField(data, SECRET_KEY);
      const enc2 = encryptField(data, SECRET_KEY);

      expect(enc1).not.toBe(enc2);
      expect(decryptField(enc1, SECRET_KEY)).toBe(data);
      expect(decryptField(enc2, SECRET_KEY)).toBe(data);
    });

    it('fails decryption with an incorrect secret key', () => {
      const plaintext = 'Sensitive doctor clinical assessment notes';
      const encrypted = encryptField(plaintext, SECRET_KEY);

      const wrongKey = 'entirely-wrong-passphrase-attempting-access';
      expect(() => decryptField(encrypted, wrongKey)).toThrow();
    });

    it('fails decryption when ciphertext payload is tampered (integrity check)', () => {
      const plaintext = 'Verified medical record payload';
      const encrypted = encryptField(plaintext, SECRET_KEY);
      const [iv, tag, cipher] = encrypted.split(':');

      // Tamper 1 character of ciphertext
      const tamperedCipher = cipher.slice(0, -2) + (cipher.slice(-2) === 'aa' ? 'bb' : 'aa');
      const tamperedPayload = `${iv}:${tag}:${tamperedCipher}`;

      expect(() => decryptField(tamperedPayload, SECRET_KEY)).toThrow();
    });

    it('fails decryption when auth tag is tampered (authenticity check)', () => {
      const plaintext = 'Verified medical record payload';
      const encrypted = encryptField(plaintext, SECRET_KEY);
      const [iv, tag, cipher] = encrypted.split(':');

      // Tamper auth tag
      const tamperedTag = '00' + tag.slice(2);
      const tamperedPayload = `${iv}:${tamperedTag}:${cipher}`;

      expect(() => decryptField(tamperedPayload, SECRET_KEY)).toThrow();
    });
  });
});
