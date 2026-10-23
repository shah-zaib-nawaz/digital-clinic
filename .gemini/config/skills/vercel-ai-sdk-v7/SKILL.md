---
name: vercel-ai-sdk-v7
description: Standard patterns and requirements for Vercel AI SDK v7 (ai@7.0.143), ToolLoopAgent, deferred tool search, HMAC-signed HITL approvals, crash-resilient step persistence, and MCP tool drift detection with OpenAI gpt-5.4.
triggers:
  - ai-sdk
  - ToolLoopAgent
  - toolSearch
  - hitl
  - hmac-approval
  - gpt-5.4
  - mcp-tool-drift
---

# Vercel AI SDK v7 (`ai@7.0.143`) Engineering Guidelines

## 1. Core Architecture Principles
- Use `ToolLoopAgent` with OpenAI `gpt-5.4` for primary conversational triage and `gpt-5.4-nano` for background intent classification and token-sparing preprocessing.
- Configure `toolCallConcurrency: 1` to strictly serialize clinical tool side-effects (e.g., verifying availability before holding slots).
- Enable `toolSearch({ deferLoading: true })` to prevent schema bloat in context windows when managing extensive MCP tool suites.
- Mandate **HMAC-signed Human-in-the-Loop (HITL)** approval cards before executing state-altering actions (e.g., slot reservations, cancellations, prescription drafts).
- Persist intermediate agent steps using `onUIMessageStepEnd` for crash-resilient session reconstruction.
- Monitor MCP servers with `@ai-sdk/mcp@2.0.76` using `fingerprintTools()` and `detectToolDrift()` to prevent runtime signature mismatch.

---

## 2. ToolLoopAgent Setup with OpenAI `gpt-5.4`

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { ToolLoopAgent, tool, toolSearch, stepStream } from 'ai';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { ChatLog } from '@/models/ChatLog';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.AI_GATEWAY_API_KEY
    ? 'https://gateway.ai.cloudflare.com/v1/endpoint/openai'
    : undefined,
});

export const clinicalModel = openai('gpt-5.4');
export const classifierModel = openai('gpt-5.4-nano');

// HMAC Token Generator for HITL tool approvals
export function generateHitlToken(payload: Record<string, any>): string {
  const secret = process.env.AI_HMAC_SECRET!;
  const serialized = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(serialized).digest('hex');
  const token = Buffer.from(JSON.stringify({ payload, signature, timestamp: Date.now() })).toString('base64url');
  return token;
}

export function verifyHitlToken(token: string): { valid: boolean; payload?: any } {
  try {
    const secret = process.env.AI_HMAC_SECRET!;
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
    const { payload, signature, timestamp } = decoded;

    // Reject tokens older than 10 minutes
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return { valid: false };
    }

    const expectedSig = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expectedSig, 'hex');

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
```

---

## 3. Tool Declarations & Deferred Tool Search

```typescript
export const clinicalTools = {
  searchDoctors: tool({
    description: 'Search clinic physicians by department, condition, or rating',
    parameters: z.object({
      specialization: z.string().optional(),
      departmentId: z.string().optional(),
      maxFee: z.number().optional(),
    }),
    execute: async ({ specialization, departmentId, maxFee }) => {
      // Query MongoDB Doctor collection
      return { doctors: [] };
    },
  }),

  // State-altering tool requiring Human-in-the-Loop Confirmation
  requestSlotHoldApproval: tool({
    description: 'Requests patient confirmation to hold a specific doctor slot for 5 minutes',
    parameters: z.object({
      doctorId: z.string(),
      doctorName: z.string(),
      date: z.string(),
      startTime: z.string(),
      fee: z.number(),
    }),
    execute: async (input) => {
      // Generate cryptographic HMAC approval token
      const approvalToken = generateHitlToken(input);
      return {
        requiresApproval: true,
        actionType: 'HOLD_SLOT',
        summary: `Hold slot with ${input.doctorName} on ${input.date} at ${input.startTime}`,
        approvalToken,
      };
    },
  }),
};
```

---

## 4. Crash-Resilient Step Persistence & Agent Execution

```typescript
export async function runClinicalTriageAgent({
  sessionId,
  userId,
  messages,
}: {
  sessionId: string;
  userId?: string;
  messages: any[];
}) {
  const agent = new ToolLoopAgent({
    model: clinicalModel,
    tools: clinicalTools,
    // Deferred tool search avoids passing all schema tokens up-front
    toolSearch: toolSearch({ deferLoading: true }),
    // Enforce strict serial tool execution for clinical safety
    toolCallConcurrency: 1,
    maxSteps: 8,
    systemPrompt: `You are the empathetic, precise AI Clinical Receptionist for Digital Clinic.
Assist patients with specialty recommendations, slot discovery, and appointment reservations.
Never prescribe medication or provide binding medical diagnoses.
Always trigger 'requestSlotHoldApproval' when confirming a booking request.`,
  });

  return agent.stream({
    messages,
    onUIMessageStepEnd: async (step) => {
      // Crash resilience: Persist intermediate step state to MongoDB ChatLog
      await ChatLog.updateOne(
        { sessionId },
        {
          $setOnInsert: { userId, createdAt: new Date() },
          $set: { updatedAt: new Date() },
          $push: {
            messages: {
              role: step.role,
              content: step.content,
              timestamp: new Date(),
              toolInvocations: step.toolInvocations,
            },
          },
        },
        { upsert: true }
      );
    },
  });
}
```

---

## 5. MCP Tool Drift Detection

```typescript
import { fingerprintTools, detectToolDrift } from '@ai-sdk/mcp';

export function assertNoToolDrift(currentTools: Record<string, any>, baselineFingerprint: string) {
  const currentFingerprint = fingerprintTools(currentTools);
  const drift = detectToolDrift(currentFingerprint, baselineFingerprint);

  if (drift.hasDrift) {
    console.error('⚠️ Tool Drift Detected in MCP Definitions:', drift.changes);
    throw new Error(`MCP_TOOL_DRIFT: Tool schema changed. Re-verify agent prompt signatures.`);
  }
}
```
