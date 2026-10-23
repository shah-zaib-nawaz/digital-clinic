import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { admin, twoFactor, oneTap } from 'better-auth/plugins';
import { MongoClient, ObjectId } from 'mongodb';
import { ac, roles } from '@/lib/permissions';

import * as dotenv from 'dotenv';

if (!process.env.MONGODB_URI) {
  dotenv.config({ path: '.env.local' });
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

declare global {
  var _mongoAuthClient: MongoClient | undefined;
}

const client = globalThis._mongoAuthClient || new MongoClient(uri);

if (process.env.NODE_ENV !== 'production') {
  globalThis._mongoAuthClient = client;
}

const db = client.db('digital_clinic');

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-build-and-lint-at-least-32-chars-long',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    },
  },
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: 'patient',
    }),
    twoFactor({
      issuer: 'Digital Clinic',
    }),
    oneTap(),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'patient',
        required: true,
      },
      phone: {
        type: 'string',
        required: false,
      },
      isDeleted: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Automatically initialize a Patient record for new patient users
            const userRole = (user as any).role || 'patient';
            if (userRole === 'patient') {
              const patientCollection = db.collection('patient');
              const userId = new ObjectId(user.id);
              const exists = await patientCollection.findOne({ userId });
              if (!exists) {
                await patientCollection.insertOne({
                  userId,
                  gender: 'undisclosed',
                  allergies: [],
                  chronicConditions: [],
                  documentUrls: [],
                  isDeleted: false,
                  deletedAt: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            }
          } catch (err) {
            console.error('Error creating linked patient profile in database hook:', err);
          }
        },
      },
    },
  },
});
