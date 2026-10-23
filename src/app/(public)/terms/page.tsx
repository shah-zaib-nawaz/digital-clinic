import React from 'react';
import Link from 'next/link';
import { FileCheck, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Clinical Service | Digital Clinic',
  description: 'Patient terms of service, 5-minute TTL slot reservations, and 4-hour appointment cancellation rules.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clinic Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Terms of Clinical Service
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Appointment Scheduling, Concurrency Holds & Cancellation Policies · October 2026
            </p>
          </div>
        </div>

        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              1. 5-Minute Slot Reservation Hold (TTL Policy)
            </h2>
            <p>
              When you select a consultation time slot in our 5-Step Booking Wizard, the system creates an exclusive,
              concurrency-protected hold in MongoDB for exactly 300 seconds (5 minutes). This prevents double-booking.
              If the booking is not completed within 5 minutes, the slot is automatically released back to the general pool
              via our database TTL index.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              2. 4-Hour Cancellation Policy
            </h2>
            <p>
              Patients may cancel or reschedule appointments online without charge up to <strong>4 hours</strong> prior
              to the scheduled consultation time.
            </p>
            <p className="mt-2 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-sm">
              <strong>Notice:</strong> Within 4 hours of your appointment, online self-service cancellations are locked
              to protect clinical schedules. If you experience an emergency, you must contact our clinic reception directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              3. Telehealth Consultations & Device Requirements
            </h2>
            <p>
              Virtual visits occur inside our end-to-end encrypted WebRTC telehealth rooms. Patients must permit camera
              and microphone access in their browser and ensure a stable broadband connection. Video sessions are not
              recorded by the clinic without explicit, contemporaneous written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              4. Physician Licensure & Independent Clinical Judgment
            </h2>
            <p>
              All doctors on our platform are licensed practitioners verified by national medical boards. Each physician
              exercises independent clinical judgment regarding diagnoses, tests, and prescriptions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
