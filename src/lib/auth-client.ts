'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient, twoFactorClient, oneTapClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
    twoFactorClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-google-client-id',
    }),
  ],
});

export const { useSession, signIn, signOut, signUp, getSession } = authClient;
