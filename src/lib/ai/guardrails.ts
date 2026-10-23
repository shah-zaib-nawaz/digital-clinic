import { createHash } from 'crypto';

export interface EmergencyCheckResult {
  isEmergency: boolean;
  matchedKeyword?: string;
  guidance?: string;
}

const EMERGENCY_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\b(chest pain|crushing pain|heart attack|angina|tightness in chest)\b/i, label: 'Cardiac' },
  { regex: /\b(stroke|facial droop|slurred speech|arm weakness|hemiparesis)\b/i, label: 'Neurological/Stroke' },
  { regex: /\b(can't breathe|cannot breathe|severe shortness of breath|gasping for air|respiratory failure)\b/i, label: 'Respiratory Distress' },
  { regex: /\b(coughing blood|vomiting blood|severe bleeding|uncontrollable bleeding|arterial bleed)\b/i, label: 'Severe Hemorrhage' },
  { regex: /\b(kill myself|suicide|commit suicide|end my life|self[- ]harm)\b/i, label: 'Suicidal Ideation/Self-Harm' },
  { regex: /\b(unconscious|blacked out|loss of consciousness|passed out and won't wake)\b/i, label: 'Altered Consciousness' },
  { regex: /\b(throat swelling|anaphylaxis|throat closing up|severe allergic reaction)\b/i, label: 'Anaphylaxis' },
  { regex: /\b(stiff neck with high fever|meningitis signs|sudden blindness|loss of vision)\b/i, label: 'Acute Clinical Red Flag' },
];

/**
 * Intercepts emergency red-flag clinical symptoms from patient input.
 */
export function isRedFlagEmergency(text: string): EmergencyCheckResult {
  if (!text || typeof text !== 'string') {
    return { isEmergency: false };
  }

  for (const { regex, label } of EMERGENCY_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      return {
        isEmergency: true,
        matchedKeyword: match[0],
        guidance: `EMERGENCY ALERT (${label}): Symptoms describe an acute medical emergency. You must dial 911 (or your local emergency services) or proceed to the nearest emergency department immediately. Clinic appointment booking is suspended for immediate patient safety.`,
      };
    }
  }

  return { isEmergency: false };
}

/**
 * Computes a deterministic SHA-256 fingerprint for a tool definitions record.
 * Normalizes tool names, descriptions, and input schemas to detect MCP schema drift.
 */
export function fingerprintTools(tools: Record<string, any>): string {
  const sortedToolKeys = Object.keys(tools).sort();
  const serialized = sortedToolKeys.map((key) => {
    const tool = tools[key];
    return {
      name: key,
      description: tool?.description || '',
      parameters: tool?.parameters || tool?.inputSchema ? JSON.stringify(tool.parameters || tool.inputSchema) : '',
    };
  });

  return createHash('sha256').update(JSON.stringify(serialized)).digest('hex');
}

/**
 * Compares an expected tool fingerprint against the current tools to detect drift.
 */
export function detectToolDrift(
  expectedFingerprint: string,
  currentTools: Record<string, any>
): { hasDrifted: boolean; currentFingerprint: string; details?: string } {
  const currentFingerprint = fingerprintTools(currentTools);
  const hasDrifted = expectedFingerprint !== currentFingerprint;

  return {
    hasDrifted,
    currentFingerprint,
    details: hasDrifted
      ? `Tool schema drift detected. Expected hash ${expectedFingerprint.slice(0, 10)}... but found ${currentFingerprint.slice(0, 10)}...`
      : undefined,
  };
}
