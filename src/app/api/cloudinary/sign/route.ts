import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const preset = body.preset as 'clinic_doctor_profiles' | 'clinic_medical_docs';

    if (!preset || !['clinic_doctor_profiles', 'clinic_medical_docs'].includes(preset)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported upload preset' },
        { status: 400 }
      );
    }

    // Role-based preset restriction: Only admin or doctor can upload to clinic_doctor_profiles
    const userRole = (session.user as any).role;
    if (preset === 'clinic_doctor_profiles' && !['admin', 'superadmin', 'doctor'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges for doctor profile uploads' },
        { status: 403 }
      );
    }

    const signedParams = generateUploadSignature(preset);

    return NextResponse.json(signedParams);
  } catch (error) {
    console.error('Cloudinary sign route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signature generation failed' },
      { status: 500 }
    );
  }
}
