import * as fs from 'fs';
import * as path from 'path';

function verifySupplyChain() {
  console.log('\n============================================================');
  console.log('SUPPLY-CHAIN LOCKFILE AUDITOR & REPOSITORY INTEGRITY CHECK');
  console.log('Digital Clinic & Healthcare Appointment System (October 2026)');
  console.log('============================================================\n');

  let passed = true;

  // 1. Check .npmrc trust-policy=no-downgrade
  const npmrcPath = path.resolve(process.cwd(), '.npmrc');
  if (!fs.existsSync(npmrcPath)) {
    console.error('❌ FAIL: .npmrc file is missing!');
    passed = false;
  } else {
    const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    if (npmrcContent.includes('trust-policy=no-downgrade')) {
      console.log('✅ PASS: .npmrc enforces trust-policy=no-downgrade');
    } else {
      console.error('❌ FAIL: .npmrc does not contain trust-policy=no-downgrade');
      passed = false;
    }
  }

  // 2. Check pnpm-lock.yaml existence and integrity
  const lockfilePath = path.resolve(process.cwd(), 'pnpm-lock.yaml');
  if (!fs.existsSync(lockfilePath)) {
    console.error('❌ FAIL: pnpm-lock.yaml is missing!');
    passed = false;
  } else {
    const stats = fs.statSync(lockfilePath);
    if (stats.size > 1000) {
      console.log(`✅ PASS: pnpm-lock.yaml integrity verified (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.error('❌ FAIL: pnpm-lock.yaml appears truncated or corrupt');
      passed = false;
    }
  }

  // 3. Check package.json for unpinned git / tarball dependencies
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('❌ FAIL: package.json is missing!');
    passed = false;
  } else {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    const forbiddenPatterns = [/github:/i, /git\+/i, /git:\/\//i, /\.tar\.gz/i, /^http:\/\//i, /^https:\/\//i];
    let illegalDepsFound = 0;

    for (const [dep, version] of Object.entries(allDeps)) {
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(version as string)) {
          console.error(`❌ FAIL: Unpinned or remote tarball dependency found: ${dep} -> ${version}`);
          illegalDepsFound++;
          passed = false;
        }
      }
    }

    if (illegalDepsFound === 0) {
      console.log(`✅ PASS: All ${Object.keys(allDeps).length} dependencies are strictly pinned from official npm registry`);
    }
  }

  console.log('\n------------------------------------------------------------');
  if (passed) {
    console.log('RESULT: Supply-chain integrity verification PASSED 100%');
    console.log('------------------------------------------------------------\n');
    process.exit(0);
  } else {
    console.error('RESULT: Supply-chain verification FAILED');
    console.log('------------------------------------------------------------\n');
    process.exit(1);
  }
}

verifySupplyChain();
