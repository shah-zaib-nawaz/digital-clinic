---
name: better-auth-1-7
description: Production guidelines and patterns for Better Auth 1.7.12, @better-auth/mongo-adapter, createAccessControl RBAC, Google One Tap, 2FA, Admin plugin, and @better-auth-ui components.
triggers:
  - better-auth
  - mongo-adapter
  - createAccessControl
  - rbac
  - oneTap
  - twoFactor
  - better-auth-ui
---

# Better Auth 1.7.12 Engineering Guidelines

## 1. Core Principles
- Leverage `@better-auth/mongo-adapter@1.7.12` directly with the native MongoDB Client to align with existing replica set connection pooling.
- Define strict RBAC with `createAccessControl` across 4 clinical roles: `patient`, `doctor`, `admin`, and `superadmin`.
- Enable `oneTap()` for low-friction patient mobile onboarding and `twoFactor()` for provider/admin multi-factor authentication.
- Integrate `@better-auth-ui` prebuilt shadcn-compatible components for sign-in modals, user menus, and session management.

---

## 2. Better Auth Server Configuration (`src/lib/auth.ts`)

```typescript
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { admin, twoFactor, oneTap } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('digital_clinic');

// Define Clinical RBAC Schema
export const ac = createAccessControl({
  patient: {
    appointment: ['create', 'read:own', 'cancel:own'],
    visitNote: ['read:own'],
    profile: ['read:own', 'update:own'],
  },
  doctor: {
    appointment: ['read:assigned', 'update:assigned'],
    visitNote: ['create:assigned', 'read:assigned', 'update:assigned', 'sign:assigned'],
    availability: ['create:own', 'read:own', 'update:own'],
  },
  admin: {
    appointment: ['create:any', 'read:any', 'update:any', 'cancel:any', 'reschedule:any'],
    doctor: ['create', 'read', 'update'],
    department: ['create', 'read', 'update', 'delete'],
    visitNote: ['read:any'],
  },
  superadmin: {
    '*': ['*'],
  },
});

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    oneTap({
      autoSelect: true,
      context: 'signin',
    }),
    twoFactor({
      issuer: 'Digital Clinic',
    }),
    admin({
      defaultRole: 'patient',
      roles: ['patient', 'doctor', 'admin', 'superadmin'],
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'patient',
        required: true,
      },
    },
  },
});
```

---

## 3. Server Action & Route Guarding Helper

```typescript
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function getSessionOrThrow() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  return session;
}

export async function requireRole(allowedRoles: Array<'patient' | 'doctor' | 'admin' | 'superadmin'>) {
  const session = await getSessionOrThrow();
  const userRole = (session.user as any).role;

  if (!allowedRoles.includes(userRole)) {
    throw new Error('UNAUTHORIZED_CLINICAL_ROLE');
  }

  return session;
}
```

---

## 4. Client Integration (`@better-auth-ui`)

```typescript
'use client';

import { createAuthClient } from 'better-auth/react';
import { oneTapClient, twoFactorClient, adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    }),
    twoFactorClient(),
    adminClient(),
  ],
});

export const { useSession, signIn, signOut, signUp } = authClient;
```
