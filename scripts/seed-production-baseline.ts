import { connectDB } from '../src/lib/db';
import { Department } from '../src/models/Department';
import { User } from '../src/models/User';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASELINE_DEPARTMENTS = [
  {
    name: 'Cardiology',
    slug: 'cardiology',
    description: 'Specialized clinical cardiovascular care, ECG diagnostics, and hypertension management.',
    iconName: 'HeartPulse',
    isActive: true,
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    description: 'Comprehensive dermatology, skin lesion evaluations, and outpatient procedural dermatologic care.',
    iconName: 'Shield',
    isActive: true,
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    description: 'Well-child wellness examinations, pediatric development assessments, and childhood immunizations.',
    iconName: 'Baby',
    isActive: true,
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    description: 'Diagnostic neurological consultation, headache clinics, and cognitive health management.',
    iconName: 'Brain',
    isActive: true,
  },
  {
    name: 'General Medicine',
    slug: 'general-medicine',
    description: 'Primary outpatient medical consultations, preventative screenings, and chronic illness care.',
    iconName: 'Stethoscope',
    isActive: true,
  },
  {
    name: 'Orthopedics',
    slug: 'orthopedics',
    description: 'Musculoskeletal evaluation, joint health, sports injury assessment, and rehabilitation referrals.',
    iconName: 'Activity',
    isActive: true,
  },
];

async function seedProductionBaseline() {
  console.log('\n============================================================');
  console.log('IDEMPOTENT PRODUCTION BASELINE SEEDER');
  console.log('Digital Clinic & Healthcare Appointment System (October 2026)');
  console.log('============================================================\n');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Replica Set');

    // 1. Seed Core Medical Departments (Idempotent)
    let deptsCreated = 0;
    let deptsExisting = 0;

    for (const deptData of BASELINE_DEPARTMENTS) {
      const existing = await Department.findOne({ slug: deptData.slug });
      if (!existing) {
        await Department.create(deptData);
        console.log(`[CREATED] Department: ${deptData.name} (slug: ${deptData.slug})`);
        deptsCreated++;
      } else {
        deptsExisting++;
      }
    }
    console.log(`\nDepartments Status: ${deptsCreated} created, ${deptsExisting} existing (Total: ${BASELINE_DEPARTMENTS.length})`);

    // 2. Seed Superadmin Account (Idempotent)
    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@digitalclinic.org';
    const existingSuperadmin = await User.findOne({ email: superadminEmail });

    if (!existingSuperadmin) {
      await User.create({
        name: 'Chief Clinical Administrator',
        email: superadminEmail,
        role: 'superadmin',
        emailVerified: true,
      });
      console.log(`[CREATED] Superadmin Account: ${superadminEmail} (role: superadmin)`);
    } else {
      console.log(`[EXISTING] Superadmin Account already present: ${superadminEmail}`);
    }

    console.log('\n------------------------------------------------------------');
    console.log('RESULT: Production baseline database initialization COMPLETE');
    console.log('------------------------------------------------------------\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during production seeding:', error);
    process.exit(1);
  }
}

seedProductionBaseline();
