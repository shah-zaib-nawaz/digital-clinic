/**
 * Seed Authentication Users Script
 * Seeds the 4 primary clinical test roles:
 * - patient@clinic.test
 * - doctor@clinic.test
 * - admin@clinic.test
 * - superadmin@clinic.test
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { auth } from '../src/lib/auth';
import { connectDB } from '../src/lib/db';
import { User } from '../src/models/User';
import { Patient } from '../src/models/Patient';

const TEST_USERS = [
  {
    name: 'Sarah Jenkins',
    email: 'patient@clinic.test',
    password: 'Password123!',
    role: 'patient',
  },
  {
    name: 'Dr. Marcus Vance',
    email: 'doctor@clinic.test',
    password: 'Password123!',
    role: 'doctor',
  },
  {
    name: 'Elena Rostova',
    email: 'admin@clinic.test',
    password: 'Password123!',
    role: 'admin',
  },
  {
    name: 'Alex Chen',
    email: 'superadmin@clinic.test',
    password: 'Password123!',
    role: 'superadmin',
  },
];

async function seedUsers() {
  console.log('🌱 Seeding clinical test accounts into MongoDB...');
  await connectDB();

  for (const userDef of TEST_USERS) {
    try {
      const existingUser = await User.findOne({ email: userDef.email });
      if (existingUser) {
        console.log(`ℹ️ User "${userDef.email}" exists. Ensuring role is "${userDef.role}"...`);
        existingUser.role = userDef.role as any;
        await existingUser.save();
      } else {
        console.log(`Creating user: ${userDef.email} (${userDef.role})...`);
        const response = await auth.api.signUpEmail({
          body: {
            email: userDef.email,
            password: userDef.password,
            name: userDef.name,
          },
        });

        if (response && response.user) {
          console.log(`✅ Created base auth record for ${userDef.email} (ID: ${response.user.id})`);
          await User.updateOne(
            { email: userDef.email },
            { $set: { role: userDef.role, emailVerified: true } }
          );
        }
      }

      // If patient, ensure Patient profile exists
      if (userDef.role === 'patient') {
        const u = await User.findOne({ email: userDef.email });
        if (u) {
          const patientProfile = await Patient.findOne({ userId: u._id });
          if (!patientProfile) {
            await Patient.create({
              userId: u._id,
              dateOfBirth: new Date('1984-06-15'),
              gender: 'female',
              bloodType: 'O+',
              allergies: ['Penicillin', 'Sulfa drugs'],
              chronicConditions: ['Migraine with aura'],
              emergencyContact: {
                name: 'Mark Jenkins',
                relationship: 'Spouse',
                phone: '+1-555-0199',
              },
              insurance: {
                provider: 'Aetna Clinical Gold',
                policyNumber: 'AET-994821',
                groupNumber: 'GRP-0021',
              },
              documentUrls: [],
            });
            console.log(`✅ Seeded linked Patient profile for ${userDef.email}`);
          }
        }
      }
    } catch (err: any) {
      console.warn(`Warning while creating ${userDef.email}:`, err?.message || err);
    }
  }

  // Print all seeded users
  const allUsers = await User.find({}, 'name email role').lean();
  console.log('📋 Current Users in Database:');
  console.table(allUsers.map((u) => ({ ID: u._id.toString(), Name: u.name, Email: u.email, Role: u.role })));

  console.log('🎉 Seeding completed successfully.');
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
