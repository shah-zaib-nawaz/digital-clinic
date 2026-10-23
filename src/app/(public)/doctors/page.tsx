import { Suspense } from 'react';
import Link from 'next/link';
import {
  getCachedDoctorDirectory,
  getCachedDepartments,
} from '@/lib/queries/doctor-directory';
import { DoctorDirectoryClient } from '@/components/doctors/doctor-directory-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ShieldCheck, HeartPulse } from 'lucide-react';

export const metadata = {
  title: 'Find Doctors & Specialists | Digital Clinic',
  description:
    'Browse our board-certified medical physicians across cardiology, pediatrics, neurology, dermatology, and general medicine.',
};

export default async function PublicDoctorDirectoryPage() {
  const [doctors, departments] = await Promise.all([
    getCachedDoctorDirectory(),
    getCachedDepartments(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Digital Clinic</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background border-b py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-4 w-4" /> Board-Certified Healthcare Providers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Find the Right Specialist for Your Care
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Book in-person or telemedicine consultations with leading medical specialists. View verified credentials, patient ratings, and real-time availability.
          </p>
        </div>
      </section>

      {/* Directory Grid & Filters */}
      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-7xl">
        <Suspense fallback={<DirectorySkeleton />}>
          <DoctorDirectoryClient
            initialDoctors={doctors}
            departments={departments}
            baseBookingPath="/patient/book"
          />
        </Suspense>
      </main>
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
