import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserButton } from '@/components/auth/user-button';
import {
  CalendarCheck,
  Stethoscope,
  ShieldCheck,
  Activity,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Digital Clinic
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 sm:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            HIPAA-Ready Healthcare & Concurrency-Safe Booking
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Precision Clinical Scheduling & Outpatient Care
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Fast, reliable consultations connecting patients and clinical specialists.
            Featuring 5-minute atomic slot locks, sealed SOAP visit notes, and conversational AI triage.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="gap-2 shadow-lg">
              <Link href="/auth/sign-in">
                Access Clinical Portal <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/patient">Patient Experience</Link>
            </Button>
          </div>
        </section>

        {/* Portal Quick Access Cards */}
        <section className="container mx-auto px-4 py-12 sm:px-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Patient Portal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore doctor directories, reserve verified slots with 5-minute hold guarantees, and access records.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/patient">Enter Patient Portal</Link>
              </Button>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Doctor Workspace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage today's consultation queue, author and seal SOAP visit notes, and configure recurring availability.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/doctor">Enter Doctor Workspace</Link>
              </Button>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Admin Command Center</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time clinic analytics, provider coverage, atomic multi-slot reschedule transactions, and audit logs.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/admin">Enter Admin Center</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 Digital Clinic Healthcare System. All rights reserved.
      </footer>
    </div>
  );
}
