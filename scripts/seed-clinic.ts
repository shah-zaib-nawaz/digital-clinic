/**
 * Clinic Master Seeding Script
 * Seeds:
 * 1. 6 Clinical Departments
 * 2. 12 Credentialed Doctors with User accounts & profiles
 * 3. 7-Day Availability Schedules for each Doctor (Mon-Fri 09:00-17:00)
 * 4. 5 Patient test accounts with medical intake profiles
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { Department } from '../src/models/Department';
import { User } from '../src/models/User';
import { Doctor } from '../src/models/Doctor';
import { AvailabilitySlot } from '../src/models/AvailabilitySlot';
import { Patient } from '../src/models/Patient';
import { auth } from '../src/lib/auth';

const DEPARTMENTS = [
  {
    name: 'Cardiology',
    slug: 'cardiology',
    iconName: 'HeartPulse',
    description:
      'Comprehensive cardiovascular care, diagnostic echocardiography, cardiac catheterization, arrhythmia management, and preventive heart health.',
    isActive: true,
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    iconName: 'Sparkles',
    description:
      'Medical, surgical, and cosmetic dermatology specializing in skin cancer screenings, acne treatments, eczema, psoriasis, and laser procedures.',
    isActive: true,
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    iconName: 'Baby',
    description:
      'Holistic medical care for infants, children, and adolescents, including developmental milestones, vaccinations, acute illnesses, and pediatric wellness.',
    isActive: true,
  },
  {
    name: 'Orthopedics',
    slug: 'orthopedics',
    iconName: 'Bone',
    description:
      'Advanced musculoskeletal diagnostics, sports medicine, joint reconstruction, fracture management, and orthopedic physical rehabilitation.',
    isActive: true,
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    iconName: 'Brain',
    description:
      'Diagnostic and therapeutic care for central and peripheral nervous system disorders, migraines, stroke prevention, epilepsy, and neuropathy.',
    isActive: true,
  },
  {
    name: 'General Medicine',
    slug: 'general-medicine',
    iconName: 'Stethoscope',
    description:
      'Primary adult healthcare, chronic disease management (diabetes, hypertension), preventive executive physicals, and acute illness treatment.',
    isActive: true,
  },
];

const DOCTORS = [
  // Cardiology
  {
    name: 'Dr. Marcus Vance',
    email: 'doctor@clinic.test', // primary test doctor
    deptSlug: 'cardiology',
    licenseNumber: 'MD-CARD-1001',
    specialization: 'Interventional Cardiology & Structural Heart Disease',
    qualifications: ['MD (Johns Hopkins)', 'FACC', 'Board Certified Cardiology'],
    yearsOfExperience: 14,
    consultationFee: 220,
    averageRating: 4.9,
    reviewCount: 48,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Marcus Vance is a board-certified interventional cardiologist with over 14 years of experience specializing in complex coronary interventions, heart failure management, and lipidology. He completed his clinical fellowship at Johns Hopkins Hospital.',
  },
  {
    name: 'Dr. Sarah Al-Mansoor',
    email: 'sarah.almansoor@clinic.test',
    deptSlug: 'cardiology',
    licenseNumber: 'MD-CARD-1002',
    specialization: 'Electrophysiology & Preventive Cardiology',
    qualifications: ['MD (Stanford University)', 'FHRS', 'Board Certified Cardiac Electrophysiology'],
    yearsOfExperience: 11,
    consultationFee: 210,
    averageRating: 4.8,
    reviewCount: 36,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Sarah Al-Mansoor specializes in cardiac rhythm disorders, pacemaker implantations, and athletic heart health. She is dedicated to non-invasive lifestyle interventions alongside cutting-edge electrophysiology.',
  },

  // Dermatology
  {
    name: 'Dr. Elena Chen',
    email: 'elena.chen@clinic.test',
    deptSlug: 'dermatology',
    licenseNumber: 'MD-DERM-2001',
    specialization: 'Mohs Micrographic Surgery & Cutaneous Oncology',
    qualifications: ['MD (Harvard Medical School)', 'FAAD', 'FACMS'],
    yearsOfExperience: 12,
    consultationFee: 195,
    averageRating: 5.0,
    reviewCount: 62,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813587-f13880eb6d8a?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Elena Chen is an internationally recognized dermatologic surgeon specializing in early skin cancer detection, Mohs micrographic surgery, and aesthetic facial reconstruction. She graduated top of her class from Harvard Medical School.',
  },
  {
    name: 'Dr. David Reynolds',
    email: 'david.reynolds@clinic.test',
    deptSlug: 'dermatology',
    licenseNumber: 'MD-DERM-2002',
    specialization: 'Pediatric Dermatology & Autoimmune Skin Conditions',
    qualifications: ['MD (Columbia P&S)', 'FAAD', 'Board Certified Dermatology'],
    yearsOfExperience: 9,
    consultationFee: 175,
    averageRating: 4.7,
    reviewCount: 29,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. David Reynolds focuses on severe eczema, pediatric skin syndromes, psoriasis biologics, and contact dermatitis. He emphasizes gentle, patient-centric treatment plans for both children and adults.',
  },

  // Pediatrics
  {
    name: 'Dr. Maya Patel',
    email: 'maya.patel@clinic.test',
    deptSlug: 'pediatrics',
    licenseNumber: 'MD-PED-3001',
    specialization: 'General Pediatrics & Adolescent Medicine',
    qualifications: ['MD (Yale School of Medicine)', 'FAAP'],
    yearsOfExperience: 10,
    consultationFee: 160,
    averageRating: 4.9,
    reviewCount: 54,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Maya Patel brings warmth, empathy, and evidence-based clinical guidance to families from infancy through teen years. Her practice covers newborn care, asthma management, childhood nutrition, and adolescent wellness.',
  },
  {
    name: 'Dr. Liam O’Connor',
    email: 'liam.oconnor@clinic.test',
    deptSlug: 'pediatrics',
    licenseNumber: 'MD-PED-3002',
    specialization: 'Developmental-Behavioral Pediatrics',
    qualifications: ['MD (Trinity College Dublin)', 'FAAP', 'Fellowship Boston Children’s'],
    yearsOfExperience: 15,
    consultationFee: 180,
    averageRating: 4.8,
    reviewCount: 41,
    isAcceptingPatients: false, // Intake paused demonstration
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Liam O’Connor specializes in neurodevelopmental assessments, ADHD, autism spectrum diagnosis, and pediatric behavioral interventions. Currently managing a waitlist for comprehensive evaluations.',
  },

  // Orthopedics
  {
    name: 'Dr. Sofia Rodriguez',
    email: 'sofia.rodriguez@clinic.test',
    deptSlug: 'orthopedics',
    licenseNumber: 'MD-ORTH-4001',
    specialization: 'Sports Medicine & Arthroscopic Reconstruction',
    qualifications: ['MD (UCLA Geffen)', 'FAAOS', 'Team Physician Certification'],
    yearsOfExperience: 13,
    consultationFee: 240,
    averageRating: 4.9,
    reviewCount: 45,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Sofia Rodriguez is an orthopedic sports surgeon who has treated collegiate and Olympic athletes. She specializes in minimally invasive ACL reconstructions, rotator cuff repairs, and cartilage restoration.',
  },
  {
    name: 'Dr. James Thorne',
    email: 'james.thorne@clinic.test',
    deptSlug: 'orthopedics',
    licenseNumber: 'MD-ORTH-4002',
    specialization: 'Total Joint Arthroplasty (Hip & Knee)',
    qualifications: ['MD (Duke University)', 'FAAOS', 'Robotic Surgery Certified'],
    yearsOfExperience: 18,
    consultationFee: 250,
    averageRating: 4.9,
    reviewCount: 58,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. James Thorne is a master surgeon in computer-navigated and robotic-assisted total hip and knee replacements, allowing rapid recovery and maximum implant longevity for patients with severe osteoarthritis.',
  },

  // Neurology
  {
    name: 'Dr. Aisha Tariq',
    email: 'aisha.tariq@clinic.test',
    deptSlug: 'neurology',
    licenseNumber: 'MD-NEUR-5001',
    specialization: 'Headache Medicine & Neuro-Immunology',
    qualifications: ['MD (McGill University)', 'FAAN', 'UCNS Certified in Headache'],
    yearsOfExperience: 11,
    consultationFee: 215,
    averageRating: 4.8,
    reviewCount: 38,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813587-f13880eb6d8a?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Aisha Tariq provides specialized care for chronic refractory migraines, trigeminal neuralgia, and multiple sclerosis, incorporating neuro-modulatory devices and targeted monoclonal antibody therapies.',
  },
  {
    name: 'Dr. Julian Croft',
    email: 'julian.croft@clinic.test',
    deptSlug: 'neurology',
    licenseNumber: 'MD-NEUR-5002',
    specialization: 'Vascular Neurology & Memory Disorders',
    qualifications: ['MD (Oxford University)', 'FRCP', 'Board Certified Neurology'],
    yearsOfExperience: 16,
    consultationFee: 230,
    averageRating: 4.7,
    reviewCount: 33,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Julian Croft leads cognitive neurological assessments, early Alzheimer detection, and secondary stroke prevention. He integrates detailed neuro-imaging with individualized neuro-protective therapies.',
  },

  // General Medicine
  {
    name: 'Dr. Thomas Wright',
    email: 'thomas.wright@clinic.test',
    deptSlug: 'general-medicine',
    licenseNumber: 'MD-GEN-6001',
    specialization: 'Executive Primary Care & Preventive Medicine',
    qualifications: ['MD (University of Pennsylvania)', 'FACP'],
    yearsOfExperience: 20,
    consultationFee: 150,
    averageRating: 4.9,
    reviewCount: 82,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Thomas Wright has served as a senior internist for two decades, delivering comprehensive preventive wellness checkups, hypertension control, metabolic syndrome reversal, and integrated health screenings.',
  },
  {
    name: 'Dr. Hannah Kim',
    email: 'hannah.kim@clinic.test',
    deptSlug: 'general-medicine',
    licenseNumber: 'MD-GEN-6002',
    specialization: 'Internal Medicine & Women’s Health',
    qualifications: ['MD (Northwestern Feinberg)', 'FACP', 'NCMP Certified'],
    yearsOfExperience: 8,
    consultationFee: 140,
    averageRating: 4.8,
    reviewCount: 43,
    isAcceptingPatients: true,
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=400&auto=format&fit=crop',
    bio: 'Dr. Hannah Kim is dedicated to patient empowerment, holistic chronic disease management, and specialized women’s wellness through every stage of adulthood.',
  },
];

const PATIENTS = [
  {
    name: 'Sarah Jenkins',
    email: 'patient@clinic.test',
    phone: '+1 (555) 234-5678',
    dateOfBirth: new Date('1988-06-15'),
    gender: 'female',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Mild Asthma'],
    emergencyContact: {
      name: 'Michael Jenkins',
      relationship: 'Spouse',
      phone: '+1 (555) 876-5432',
    },
    insurance: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BCBS-88921-A',
      groupNumber: 'GRP-9921',
    },
  },
  {
    name: 'Robert Miller',
    email: 'robert.miller@clinic.test',
    phone: '+1 (555) 345-6789',
    dateOfBirth: new Date('1975-11-20'),
    gender: 'male',
    bloodType: 'A+',
    allergies: ['Aspirin'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    emergencyContact: {
      name: 'Laura Miller',
      relationship: 'Spouse',
      phone: '+1 (555) 765-4321',
    },
    insurance: {
      provider: 'Aetna Health',
      policyNumber: 'AET-44321-X',
      groupNumber: 'GRP-1044',
    },
  },
  {
    name: 'Amara Okafor',
    email: 'amara.okafor@clinic.test',
    phone: '+1 (555) 456-7890',
    dateOfBirth: new Date('1994-03-08'),
    gender: 'female',
    bloodType: 'B+',
    allergies: [],
    chronicConditions: [],
    emergencyContact: {
      name: 'Chidi Okafor',
      relationship: 'Brother',
      phone: '+1 (555) 654-3210',
    },
    insurance: {
      provider: 'UnitedHealthcare',
      policyNumber: 'UHC-77123-B',
    },
  },
  {
    name: 'Carlos Gomez',
    email: 'carlos.gomez@clinic.test',
    phone: '+1 (555) 567-8901',
    dateOfBirth: new Date('1982-09-14'),
    gender: 'male',
    bloodType: 'AB-',
    allergies: ['Codeine'],
    chronicConditions: ['Seasonal Allergies'],
    emergencyContact: {
      name: 'Elena Gomez',
      relationship: 'Sister',
      phone: '+1 (555) 543-2109',
    },
    insurance: {
      provider: 'Cigna Health',
      policyNumber: 'CIG-90214-C',
    },
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@clinic.test',
    phone: '+1 (555) 678-9012',
    dateOfBirth: new Date('2001-12-05'),
    gender: 'female',
    bloodType: 'O-',
    allergies: ['Latex', 'Peanuts'],
    chronicConditions: [],
    emergencyContact: {
      name: 'Patricia Watson',
      relationship: 'Mother',
      phone: '+1 (555) 432-1098',
    },
    insurance: {
      provider: 'Kaiser Permanente',
      policyNumber: 'KP-33219-D',
    },
  },
];

async function seedClinic() {
  console.log('🚀 Initiating Phase 2 Clinical Master Seeding...');
  await connectDB();

  // 1. Seed Departments
  console.log('📦 Seeding 6 Clinical Departments...');
  const deptMap = new Map<string, any>();

  for (const deptDef of DEPARTMENTS) {
    let dept = await Department.findOne({ slug: deptDef.slug });
    if (!dept) {
      dept = await Department.create(deptDef);
      console.log(`  ✅ Created department: ${dept.name} (${dept.slug})`);
    } else {
      dept.name = deptDef.name;
      dept.description = deptDef.description;
      dept.iconName = deptDef.iconName;
      dept.isActive = deptDef.isActive;
      await dept.save();
      console.log(`  ℹ️ Updated department: ${dept.name}`);
    }
    deptMap.set(dept.slug, dept);
  }

  // 2. Seed Doctors & Schedules
  console.log('👨‍⚕️ Seeding 12 Credentialed Physicians & Weekly Schedules...');
  for (const docDef of DOCTORS) {
    const department = deptMap.get(docDef.deptSlug);
    if (!department) {
      console.warn(`  ⚠️ Department ${docDef.deptSlug} not found, skipping ${docDef.name}`);
      continue;
    }

    // Ensure User account exists
    let user = await User.findOne({ email: docDef.email });
    if (!user) {
      try {
        const authUser = await auth.api.signUpEmail({
          body: {
            email: docDef.email,
            password: 'Password123!',
            name: docDef.name,
          },
        });
        if (authUser && authUser.user) {
          user = await User.findById(authUser.user.id);
        }
      } catch (authErr) {
        user = await User.create({
          name: docDef.name,
          email: docDef.email,
          role: 'doctor',
          image: docDef.avatarUrl,
        });
      }
    }

    if (user) {
      user.role = 'doctor';
      user.image = docDef.avatarUrl;
      await user.save();
    }

    if (!user) {
      console.error(`  ❌ Failed to resolve user for ${docDef.email}`);
      continue;
    }

    // Ensure Doctor document exists
    let doctor = await Doctor.findOne({ licenseNumber: docDef.licenseNumber });
    if (!doctor) {
      // Also check by userId
      doctor = await Doctor.findOne({ userId: user._id });
    }

    if (!doctor) {
      doctor = await Doctor.create({
        userId: user._id,
        departmentId: department._id,
        licenseNumber: docDef.licenseNumber,
        specialization: docDef.specialization,
        qualifications: docDef.qualifications,
        yearsOfExperience: docDef.yearsOfExperience,
        consultationFee: docDef.consultationFee,
        bio: docDef.bio,
        avatarUrl: docDef.avatarUrl,
        averageRating: docDef.averageRating,
        reviewCount: docDef.reviewCount,
        isAcceptingPatients: docDef.isAcceptingPatients,
      });
      console.log(`  ✅ Registered doctor: ${docDef.name} (${docDef.specialization})`);
    } else {
      doctor.departmentId = department._id;
      doctor.licenseNumber = docDef.licenseNumber;
      doctor.specialization = docDef.specialization;
      doctor.qualifications = docDef.qualifications;
      doctor.yearsOfExperience = docDef.yearsOfExperience;
      doctor.consultationFee = docDef.consultationFee;
      doctor.bio = docDef.bio;
      doctor.avatarUrl = docDef.avatarUrl;
      doctor.averageRating = docDef.averageRating;
      doctor.reviewCount = docDef.reviewCount;
      doctor.isAcceptingPatients = docDef.isAcceptingPatients;
      await doctor.save();
      console.log(`  ℹ️ Updated doctor profile: ${docDef.name}`);
    }

    // Seed 7-Day Availability Schedule for doctor
    for (let day = 0; day <= 6; day++) {
      // Days 1 to 5 (Mon-Fri) are active 09:00 - 17:00, Days 0 & 6 are off
      const isWeekday = day >= 1 && day <= 5;
      await AvailabilitySlot.findOneAndUpdate(
        { doctorId: doctor._id, dayOfWeek: day },
        {
          $set: {
            doctorId: doctor._id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
            isActive: isWeekday,
            isDeleted: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  // 3. Seed 5 Patient Accounts & Profiles
  console.log('🧑‍🤝‍🧑 Seeding 5 Patient Accounts & Intake Records...');
  for (const patientDef of PATIENTS) {
    let user = await User.findOne({ email: patientDef.email });
    if (!user) {
      try {
        const authUser = await auth.api.signUpEmail({
          body: {
            email: patientDef.email,
            password: 'Password123!',
            name: patientDef.name,
          },
        });
        if (authUser && authUser.user) {
          user = await User.findById(authUser.user.id);
        }
      } catch (authErr) {
        user = await User.create({
          name: patientDef.name,
          email: patientDef.email,
          role: 'patient',
          phone: patientDef.phone,
        });
      }
    }

    if (user) {
      user.role = 'patient';
      user.phone = patientDef.phone;
      await user.save();

      // Upsert linked Patient profile
      await Patient.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            dateOfBirth: patientDef.dateOfBirth,
            gender: patientDef.gender,
            bloodType: patientDef.bloodType,
            allergies: patientDef.allergies,
            chronicConditions: patientDef.chronicConditions,
            emergencyContact: patientDef.emergencyContact,
            insurance: patientDef.insurance,
            isDeleted: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`  ✅ Seeded patient: ${patientDef.name} (${patientDef.email})`);
    }
  }

  console.log('\n🎉 Phase 2 Clinical Master Seeding completed successfully!');
  process.exit(0);
}

seedClinic().catch((err) => {
  console.error('❌ Seeding failed with error:', err);
  process.exit(1);
});
