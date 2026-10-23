import { createOpenAI } from '@ai-sdk/openai';

const apiKey =
  process.env.OPENAI_API_KEY ||
  process.env.AI_GATEWAY_API_KEY ||
  'sk-mock-key-for-local-development-mode';

const baseURL = process.env.AI_GATEWAY_URL || undefined;

export const openai = createOpenAI({
  apiKey,
  baseURL,
});

// Primary triage & conversational agent model
export const clinicalModel = openai('gpt-4o');

// Lightweight model for background classification and intent routing
export const classifierModel = openai('gpt-4o-mini');
