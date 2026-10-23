import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary environment variables not fully configured.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset?: string;
}

export function generateUploadSignature(
  preset: 'clinic_doctor_profiles' | 'clinic_medical_docs'
): SignedUploadParams {
  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error('Cloudinary credentials missing from environment variables');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = preset === 'clinic_doctor_profiles' ? 'doctors/profiles' : 'patients/records';

  const paramsToSign: Record<string, any> = {
    folder,
    timestamp,
    upload_preset: preset,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    uploadPreset: preset,
  };
}

export { buildCloudinaryUrl } from './cloudinary-client';
