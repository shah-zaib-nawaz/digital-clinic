// Global test setup for Vitest
process.env.AI_HMAC_SECRET = process.env.AI_HMAC_SECRET || 'test-secret-at-least-32-chars-long-for-hmac-sha256';
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'test-better-auth-secret-1234567890abcdef1234567890abcdef';
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
