---
name: nextjs-16-4-zod-4
description: Production standards for Next.js 16.4.2 LTS, App Router Cache Components ('use cache', cacheTag, cacheLife, revalidateTag, after), Tailwind CSS 4.3.3 @theme inline tokens, and Zod 4.6.7 z.compile with jitless CSP fallback.
triggers:
  - nextjs-16
  - use-cache
  - cacheTag
  - cacheLife
  - after
  - zod-4
  - z.compile
  - tailwind-v4
---

# Next.js 16.4.2 LTS & Zod 4.6.7 Engineering Standards

## 1. Next.js 16.4.2 App Router & Caching Architecture
- Utilize `"use cache"` directives on granular data fetchers and RSC leaf components instead of legacy `unstable_cache`.
- Control cache lifecycles declaratively using `cacheLife('minutes' | 'hours' | 'days')` and granular invalidation tags using `cacheTag('doctor-directory', 'department-[id]')`.
- Trigger precise tag invalidations in Server Actions using `revalidateTag()`.
- Offload non-blocking background operations (such as transactional email dispatch, audit log archiving, and analytics tracking) to `after()`.

---

## 2. Granular Cached Data Fetching

```typescript
import { cacheLife, cacheTag } from 'next/cache';
import { Doctor } from '@/models/Doctor';
import { connectToDatabase } from '@/lib/db';

export async function getCachedDoctorDirectory(departmentId?: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('doctor-directory');

  await connectToDatabase();
  const filter: any = { isAcceptingPatients: true };
  if (departmentId) {
    filter.departmentId = departmentId;
  }

  return await Doctor.find(filter)
    .sort({ averageRating: -1, reviewCount: -1 })
    .lean();
}
```

---

## 3. Server Actions with `revalidateTag` & `after` Background Tasks

```typescript
'use server';

import { revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { Appointment } from '@/models/Appointment';
import { sendConfirmationEmail } from '@/lib/email';
import { appointmentHoldSchemaCompiled } from '@/schemas/appointment.compiled';

export async function bookAppointmentAction(formData: unknown) {
  // Validate input with Zod 4.6.7 compiled schema
  const validation = appointmentHoldSchemaCompiled.safeParse(formData);
  if (!validation.success) {
    return { success: false, errors: validation.error.format() };
  }

  const { doctorId, date, startTime, patientEmail, patientName } = validation.data;

  // Perform database write
  const appointment = await Appointment.create({
    doctorId,
    date,
    startTime,
    status: 'confirmed',
  });

  // Revalidate public slots and doctor queue
  revalidateTag(`doctor-slots-${doctorId}`);
  revalidateTag('admin-appointment-analytics');

  // Schedule non-blocking background email dispatch with after()
  after(async () => {
    try {
      await sendConfirmationEmail({
        to: patientEmail,
        patientName,
        date,
        startTime,
        appointmentId: appointment._id.toString(),
      });
    } catch (err) {
      console.error('Failed to dispatch background email:', err);
    }
  });

  return { success: true, appointmentId: appointment._id.toString() };
}
```

---

## 4. Zod 4.6.7 Ahead-of-Time Schema Compilation (`z.compile()`)

Zod 4.6.7 introduces compiled validators that dramatically reduce schema evaluation overhead. On environments with strict Content Security Policies (CSP) prohibiting `eval()` / dynamic CodeGen, always enable `jitless: true`.

```typescript
import { z } from 'zod';

export const appointmentHoldSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  patientEmail: z.string().email('Invalid email address'),
  patientName: z.string().min(2, 'Name must be at least 2 characters'),
  chiefComplaint: z.string().max(2000).optional(),
});

// Ahead-of-Time Compiled Validator with jitless CSP Fallback
export const appointmentHoldSchemaCompiled = z.compile(appointmentHoldSchema, {
  jitless: true, // Guarantees compatibility with strict Content-Security-Policy headers
});
```

---

## 5. Tailwind CSS 4.3.3 `@theme inline` Consumption

In Tailwind 4, utility classes are generated directly from CSS variables declared inside `@theme inline`:

```html
<!-- Example Semantic Clinical Badge Rendering -->
<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
            bg-[var(--color-status-held-bg)] text-[var(--color-status-held)] border border-[var(--color-status-held-border)]">
  <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-status-held)] animate-pulse"></span>
  5-Minute Hold
</div>
```
