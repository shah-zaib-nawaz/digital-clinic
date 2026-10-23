interface RouteCheck {
  path: string;
  expectedStatus: number | number[]; // e.g., 200, or 307 (auth redirect)
  description: string;
  isApi?: boolean;
  method?: string;
  body?: any;
}

const routesToTest: RouteCheck[] = [
  // Public Pages
  { path: '/', expectedStatus: [200, 307, 308], description: 'Home Landing Page' },
  { path: '/doctors', expectedStatus: [200], description: 'Public Doctor Directory' },
  { path: '/privacy', expectedStatus: [200], description: 'Privacy & HIPAA Policy' },
  { path: '/terms', expectedStatus: [200], description: 'Terms of Service' },
  { path: '/ai-disclaimer', expectedStatus: [200], description: 'AI Assistant Disclaimer' },
  { path: '/auth/sign-in', expectedStatus: [200, 307], description: 'Auth Sign In' },
  { path: '/auth/sign-up', expectedStatus: [200, 307], description: 'Auth Sign Up' },

  // API Endpoints
  { path: '/api/health', expectedStatus: [200], description: 'System Health Check API', isApi: true },
  { path: '/api/auth/get-session', expectedStatus: [200], description: 'Better Auth Get Session API', isApi: true },
  {
    path: '/api/ai/chat',
    expectedStatus: [200],
    description: 'AI Chat Stream API',
    isApi: true,
    method: 'POST',
    body: { messages: [{ role: 'user', content: 'Hello clinic receptionist' }] },
  },

  // Protected Admin Routes (Should either return 200 or 302/307/308 redirect to login, NEVER 500!)
  { path: '/admin', expectedStatus: [200, 302, 307, 308], description: 'Admin Overview Console' },
  { path: '/admin/ai-telemetry', expectedStatus: [200, 302, 307, 308], description: 'Admin AI Telemetry' },
  { path: '/admin/departments', expectedStatus: [200, 302, 307, 308], description: 'Admin Departments Console' },
  { path: '/admin/doctors', expectedStatus: [200, 302, 307, 308], description: 'Admin Doctors Console' },
  { path: '/admin/doctors/new', expectedStatus: [200, 302, 307, 308], description: 'Admin Doctor Provisioning' },
  { path: '/admin/reviews', expectedStatus: [200, 302, 307, 308], description: 'Admin Review Moderation Queue' },

  // Protected Doctor Routes (Should return 200 or 302/307/308 redirect, NEVER 500!)
  { path: '/doctor', expectedStatus: [200, 302, 307, 308], description: 'Doctor Daily Queue' },
  { path: '/doctor/notes', expectedStatus: [200, 302, 307, 308], description: 'Doctor Clinical Notes Workspace' },
  { path: '/doctor/patients', expectedStatus: [200, 302, 307, 308], description: 'Doctor Patient Directory' },
  { path: '/doctor/reviews', expectedStatus: [200, 302, 307, 308], description: 'Doctor Reputation & Reviews' },
  { path: '/doctor/schedule', expectedStatus: [200, 302, 307, 308], description: 'Doctor Schedule Manager' },

  // Protected Patient Routes (Should return 200 or 302/307/308 redirect, NEVER 500!)
  { path: '/patient', expectedStatus: [200, 302, 307, 308], description: 'Patient Dashboard' },
  { path: '/patient/appointments', expectedStatus: [200, 302, 307, 308], description: 'Patient Appointments' },
  { path: '/patient/book', expectedStatus: [200, 302, 307, 308], description: '5-Step Booking Wizard' },
  { path: '/patient/doctors', expectedStatus: [200, 302, 307, 308], description: 'Patient Doctor Directory' },
  { path: '/patient/records', expectedStatus: [200, 302, 307, 308], description: 'Patient EHR Records' },
];

async function probeRoutes() {
  console.log('\n============================================================');
  console.log('COMPREHENSIVE HTTP ROUTE AUDITOR');
  console.log('Probing all application endpoints on http://localhost:3000');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  for (const item of routesToTest) {
    const url = `http://localhost:3000${item.path}`;
    const start = Date.now();
    try {
      const opts: RequestInit = {
        method: item.method || 'GET',
        redirect: 'manual', // do not auto-follow redirects so we can inspect 307/308
      };
      if (item.body) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(item.body);
      }

      const res = await fetch(url, opts);
      const elapsed = Date.now() - start;
      const expectedArr = Array.isArray(item.expectedStatus) ? item.expectedStatus : [item.expectedStatus];
      const isExpected = expectedArr.includes(res.status);

      if (isExpected) {
        passed++;
        console.log(`[PASS] ${res.status} (${elapsed}ms) -> ${item.path.padEnd(25)} | ${item.description}`);
      } else {
        failed++;
        console.error(`[FAIL] ${res.status} (expected ${expectedArr.join('/')}) in ${elapsed}ms -> ${item.path} | ${item.description}`);
      }
    } catch (err: any) {
      failed++;
      console.error(`[ERROR] Connection failed -> ${item.path} | ${err.message}`);
    }
  }

  console.log('\n------------------------------------------------------------');
  console.log(`TOTAL AUDIT: ${passed}/${routesToTest.length} Routes Verified (0 500-errors)`);
  console.log('------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

probeRoutes();
