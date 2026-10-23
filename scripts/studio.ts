/**
 * @mongoosejs/studio local launcher helper
 * Launches Mongoose Studio for inspecting local/Atlas collections and indexes.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { spawn } from 'child_process';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('🚀 Starting @mongoosejs/studio inspector...');
const studioProcess = spawn('npx', ['-y', '@mongoosejs/studio@latest', '--uri', uri], {
  stdio: 'inherit',
  shell: true,
});

studioProcess.on('close', (code) => {
  console.log(`Mongoose Studio exited with code ${code}`);
});
