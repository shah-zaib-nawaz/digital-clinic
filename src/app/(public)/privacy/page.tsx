import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy & HIPAA Compliance | Digital Clinic',
  description: 'Enterprise healthcare privacy protections, AES-256-GCM field encryption, and HIPAA compliance policies.',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Privacy Policy & Clinical Data Governance
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              HIPAA & GDPR Compliant Medical Data Architecture · Effective October 2026
            </p>
          </div>
        </div>

        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-emerald-600" />
              1. Client-Side Field Level Encryption (CSFLE)
            </h2>
            <p>
              Digital Clinic employs authenticated AES-256-GCM cryptographic encryption for all high-sensitivity
              patient fields (including national identifiers, private EHR clinical SOAP notes, and emergency contact details).
              Encryption keys are derived via cryptographic HMAC functions, ensuring that encrypted payloads are never
              stored or transmitted in cleartext.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              2. Direct Signed Medical Document Ingestion
            </h2>
            <p>
              Diagnostic records, lab summaries, and clinical PDFs uploaded by patients are transmitted directly to
              dedicated signed Cloudinary storage presets using cryptographically signed ephemeral tokens. Application
              servers never buffer, cache, or store raw medical files, minimizing data exposure and eliminating
              intermediate intercept vectors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              3. Role-Based Access Control (RBAC) & Physician Isolation
            </h2>
            <p>
              Access to electronic health records is strictly governed by Better Auth 1.7.12 role hierarchy
              (<code>patient</code>, <code>doctor</code>, <code>admin</code>, <code>superadmin</code>).
              Physicians are restricted to viewing patient records for patients with whom they hold an active or
              confirmed consultation schedule. Administrative staff cannot inspect sealed clinical subjective notes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              4. Data Retention & Cryptographic Audit Trails
            </h2>
            <p>
              All appointment mutations, rescheduling events, and note finalization timestamps are logged with
              cryptographic integrity hashes. Patient record deletion requests adhere to HIPAA medical retention laws
              utilizing non-destructive soft-delete schemas (<code>isDeleted: true</code>) with access revoked from all
              patient portals immediately.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
