import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
      'MONGODB_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://'
    )
    .default('mongodb+srv://clinic_admin:g75wd7hivFy4hDKO@cluster0.qml7ujd.mongodb.net/digital_clinic?retryWrites=true&w=majority'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    .default('dev-better-auth-secret-1234567890abcdef1234567890abcdef'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  AI_HMAC_SECRET: z
    .string()
    .min(32, 'AI_HMAC_SECRET must be at least 32 characters')
    .default('dev-hmac-secret-at-least-32-chars-long-clinic-ai-token'),
  OPENAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AI_DAILY_SPEND_CAP_USD: z.coerce.number().positive().default(50.0),
  AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().positive().default(20),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export const serverEnvSchemaCompiled = z.compile(serverEnvSchema);
export const clientEnvSchemaCompiled = z.compile(clientEnvSchema);

export function validateEnv() {
  const serverResult = serverEnvSchemaCompiled.safeParse(process.env);
  const clientResult = clientEnvSchemaCompiled.safeParse({
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });

  if (!serverResult.success) {
    const errors = serverResult.error.format();
    console.error('❌ Critical Server Environment Validation Failure:', JSON.stringify(errors, null, 2));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing or invalid required production environment variables. Aborting startup.');
    }
  }

  if (!clientResult.success) {
    const errors = clientResult.error.format();
    console.warn('⚠️ Client Environment Warning:', JSON.stringify(errors, null, 2));
  }

  return {
    server: serverResult.success ? serverResult.data : (serverEnvSchema.parse({})),
    client: clientResult.success ? clientResult.data : {},
  };
}

export const env = validateEnv();
