/**
 * Cloudinary Upload Preset Provisioning Script
 * Provisions idempotent signed upload presets for:
 * 1. clinic_doctor_profiles: Doctor avatars with face-detect thumbnail cropping
 * 2. clinic_medical_docs: Patient intake records (PDFs, scans, DICOM)
 */

import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Missing Cloudinary environment variables in .env.local');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

interface PresetDefinition {
  name: string;
  options: {
    unsigned: boolean;
    folder: string;
    allowed_formats?: string[];
    transformation?: Array<Record<string, any>>;
    access_mode?: 'public' | 'authenticated';
  };
}

const PRESETS: PresetDefinition[] = [
  {
    name: 'clinic_doctor_profiles',
    options: {
      unsigned: false, // Strict signed-only uploads
      folder: 'doctors/profiles',
      allowed_formats: ['jpg', 'png', 'webp', 'avif'],
      transformation: [
        {
          crop: 'thumb',
          gravity: 'face',
          width: 500,
          height: 500,
          fetch_format: 'auto',
          quality: 'auto',
        },
      ],
    },
  },
  {
    name: 'clinic_medical_docs',
    options: {
      unsigned: false, // Strict signed-only uploads
      folder: 'patients/documents',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      access_mode: 'authenticated', // Protected clinical documents
    },
  },
];

async function ensurePreset(preset: PresetDefinition) {
  try {
    // Check if preset already exists
    const existing = await cloudinary.api.upload_preset(preset.name);
    console.log(`ℹ️ Preset "${preset.name}" exists. Updating...`);
    await cloudinary.api.update_upload_preset(preset.name, preset.options);
    console.log(`✅ Preset "${preset.name}" updated successfully.`);
  } catch (error: any) {
    if (error?.error?.http_code === 404 || error?.http_code === 404) {
      console.log(`ℹ️ Preset "${preset.name}" not found. Creating...`);
      await cloudinary.api.create_upload_preset({
        name: preset.name,
        ...preset.options,
      });
      console.log(`✅ Preset "${preset.name}" created successfully.`);
    } else {
      console.error(`❌ Error managing preset "${preset.name}":`, error);
      throw error;
    }
  }
}

export async function setupCloudinaryPresets() {
  console.log(`🚀 Connecting to Cloudinary cloud: "${cloudName}"...`);
  for (const preset of PRESETS) {
    await ensurePreset(preset);
  }
  console.log('🎉 All Cloudinary upload presets verified and configured.');
}

// Allow direct CLI invocation
if (require.main === module) {
  setupCloudinaryPresets().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
