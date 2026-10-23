import { describe, it, expect } from 'vitest';
import { generateHitlToken, verifyHitlToken } from '../hitl';
import { isRedFlagEmergency, fingerprintTools, detectToolDrift } from '../guardrails';

describe('AI Guardrails, HMAC Security & MCP Drift Detection', () => {
  describe('HMAC-SHA256 Human-in-the-Loop Approval Tokens', () => {
    const samplePayload = {
      doctorId: '60d0fe4f5311236168a109ca',
      doctorName: 'Dr. Sarah Jenkins',
      date: '2026-11-10',
      startTime: '10:00',
      endTime: '10:30',
      consultationFee: 150,
    };

    it('generates a valid base64url HMAC token and successfully verifies it', () => {
      const token = generateHitlToken(samplePayload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      const verification = verifyHitlToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.doctorId).toBe(samplePayload.doctorId);
      expect(verification.payload?.doctorName).toBe(samplePayload.doctorName);
      expect(verification.payload?.consultationFee).toBe(150);
    });

    it('rejects tampered token payloads where parameters were altered (e.g. fee manipulation)', () => {
      const token = generateHitlToken(samplePayload);
      const decodedRaw = Buffer.from(token, 'base64url').toString('utf-8');
      const parsed = JSON.parse(decodedRaw);

      // Maliciously alter consultation fee from $150 to $0
      parsed.payload.consultationFee = 0;

      const tamperedToken = Buffer.from(JSON.stringify(parsed), 'utf-8').toString('base64url');
      const verification = verifyHitlToken(tamperedToken);

      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('TOKEN_TAMPERED');
    });

    it('rejects tampered tokens with forged signature', () => {
      const token = generateHitlToken(samplePayload);
      const decodedRaw = Buffer.from(token, 'base64url').toString('utf-8');
      const parsed = JSON.parse(decodedRaw);

      parsed.signature = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

      const tamperedToken = Buffer.from(JSON.stringify(parsed), 'utf-8').toString('base64url');
      const verification = verifyHitlToken(tamperedToken);

      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('TOKEN_TAMPERED');
    });

    it('rejects expired tokens older than 10 minutes (600,000 ms)', () => {
      const token = generateHitlToken(samplePayload);
      const decodedRaw = Buffer.from(token, 'base64url').toString('utf-8');
      const parsed = JSON.parse(decodedRaw);

      // Forge timestamp to 11 minutes ago
      parsed.payload.timestamp = Date.now() - 11 * 60 * 1000;

      // Note: Re-signing with HMAC or passing through expiry check
      const expiredToken = Buffer.from(JSON.stringify(parsed), 'utf-8').toString('base64url');
      const verification = verifyHitlToken(expiredToken);

      expect(verification.valid).toBe(false);
      expect(verification.error).toContain('TOKEN_EXPIRED');
    });

    it('gracefully handles garbage or non-base64 input', () => {
      const verification = verifyHitlToken('not-a-valid-token-string!@#$');
      expect(verification.valid).toBe(false);
    });
  });

  describe('Emergency Red-Flag Clinical Symptom Interception', () => {
    it('detects cardiac emergency symptoms (crushing chest pain)', () => {
      const result = isRedFlagEmergency('I have crushing chest pain radiating to my left arm.');
      expect(result.isEmergency).toBe(true);
      expect(result.matchedKeyword?.toLowerCase()).toContain('chest pain');
      expect(result.guidance).toContain('911');
    });

    it('detects neurological stroke symptoms (slurred speech, arm weakness)', () => {
      const result = isRedFlagEmergency('My grandmother suddenly has facial droop and slurred speech.');
      expect(result.isEmergency).toBe(true);
      expect(result.matchedKeyword?.toLowerCase()).toContain('facial droop');
    });

    it('detects acute respiratory distress', () => {
      const result = isRedFlagEmergency('I cannot breathe and feel like my lungs are closing.');
      expect(result.isEmergency).toBe(true);
      expect(result.guidance).toContain('EMERGENCY ALERT');
    });

    it('detects active suicidal ideation or self-harm intent', () => {
      const result = isRedFlagEmergency('I feel desperate and want to end my life.');
      expect(result.isEmergency).toBe(true);
      expect(result.guidance).toContain('EMERGENCY ALERT');
    });

    it('permits routine non-emergency appointment complaints', () => {
      const normalQueries = [
        'I need an annual physical exam with Dr. Jenkins.',
        'Looking for a dermatologist for minor eczema flare-up.',
        'Would like to book a follow-up visit for routine blood pressure check.',
        'Do you have pediatric slots available on Tuesday morning?',
      ];

      for (const q of normalQueries) {
        const result = isRedFlagEmergency(q);
        expect(result.isEmergency).toBe(false);
      }
    });
  });

  describe('MCP Tool Drift Detection', () => {
    const baseTools = {
      searchDoctors: {
        description: 'Search clinic physicians',
        parameters: { type: 'object', properties: { specialty: { type: 'string' } } },
      },
      checkDoctorAvailability: {
        description: 'Check doctor availability',
        parameters: { type: 'object', properties: { doctorId: { type: 'string' }, date: { type: 'string' } } },
      },
    };

    it('produces identical fingerprints for identical tool suites regardless of key order', () => {
      const reorderedTools = {
        checkDoctorAvailability: baseTools.checkDoctorAvailability,
        searchDoctors: baseTools.searchDoctors,
      };

      const hash1 = fingerprintTools(baseTools);
      const hash2 = fingerprintTools(reorderedTools);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64); // SHA-256
    });

    it('detects drift when tool description or parameters change', () => {
      const baselineFingerprint = fingerprintTools(baseTools);

      const modifiedTools = {
        ...baseTools,
        searchDoctors: {
          ...baseTools.searchDoctors,
          description: 'MODIFIED description: Search clinic doctors with new filter',
        },
      };

      const driftResult = detectToolDrift(baselineFingerprint, modifiedTools);
      expect(driftResult.hasDrifted).toBe(true);
      expect(driftResult.details).toContain('Tool schema drift detected');
    });

    it('reports no drift when tool suite matches baseline fingerprint', () => {
      const baselineFingerprint = fingerprintTools(baseTools);
      const driftResult = detectToolDrift(baselineFingerprint, baseTools);
      expect(driftResult.hasDrifted).toBe(false);
      expect(driftResult.details).toBeUndefined();
    });
  });
});
