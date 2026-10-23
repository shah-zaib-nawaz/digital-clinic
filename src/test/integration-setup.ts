import { beforeAll, afterEach, afterAll } from 'vitest';
import { mswServer } from './msw-server';
import { connectDB } from '@/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

beforeAll(async () => {
  (mswServer as any).listen({ onUnhandledRequest: 'bypass' });
  await connectDB();
}, 60000);

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(async () => {
  mswServer.close();
});
