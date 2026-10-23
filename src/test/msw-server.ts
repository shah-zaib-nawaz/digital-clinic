import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Resend Email API
  http.post('https://api.resend.com/emails', async () => {
    return HttpResponse.json(
      {
        id: `mock_email_${Date.now()}`,
        from: 'Digital Clinic <notifications@digitalclinic.org>',
      },
      { status: 200 }
    );
  }),

  // Mock Cloudinary Signature & Ingestion API
  http.post('https://api.cloudinary.com/v1_1/:cloudName/image/upload', async () => {
    return HttpResponse.json(
      {
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/mock_medical_asset.png',
        public_id: 'mock_medical_asset',
        format: 'png',
      },
      { status: 200 }
    );
  }),
];

export const mswServer = setupServer(...handlers);
