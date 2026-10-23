import React from 'react';
import Link from 'next/link';
import { Bot, AlertOctagon, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Clinical AI Assistant Disclaimer & Safety Guardrails | Digital Clinic',
  description: 'Non-diagnostic boundaries, emergency symptom escalation protocols, and cryptographic Human-in-the-Loop safeguards.',
};

export default function AiDisclaimerPage() {
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
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-700 dark:text-indigo-400">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Clinical AI Receptionist Disclaimer
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Safety Guardrails, Emergency Deflection & Non-Diagnostic Operating Boundaries
            </p>
          </div>
        </div>

        {/* Emergency Alert Banner */}
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-6 rounded-2xl mb-8 flex items-start gap-4">
          <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-red-900 dark:text-red-200">
              Medical Emergency Warning
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1 leading-relaxed">
              If you or someone in your care is experiencing crushing chest pain, difficulty breathing, stroke symptoms
              (facial droop, slurred speech), severe bleeding, acute suicidal thoughts, or loss of consciousness,
              <strong> DO NOT USE THIS PLATFORM. Dial 911 or proceed to the nearest emergency room immediately.</strong>
            </p>
          </div>
        </div>

        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              1. Non-Diagnostic Triage Boundaries
            </h2>
            <p>
              The Digital Clinic AI Receptionist (powered by Vercel AI SDK v7) is an administrative assistant designed to
              help patients navigate medical specialties, explore available doctor schedules, and coordinate appointments.
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600 dark:text-slate-400">
              <li>The AI does <strong>not</strong> provide medical diagnoses, treatment plans, or second opinions.</li>
              <li>The AI will <strong>never</strong> prescribe medications, calculate drug dosages, or adjust regimens.</li>
              <li>Conversational discussions with the AI do not establish a formal doctor-patient relationship.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              2. Cryptographic Human-in-the-Loop (HITL) Tool Approval
            </h2>
            <p>
              To ensure safety and prevent unapproved mutations, the AI Assistant cannot unilaterally book, hold, or modify
              any appointment. Whenever a slot reservation is requested, the system issues a tamper-evident, HMAC-SHA256
              signed confirmation card that requires direct human approval with a 10-minute validity cutoff.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              3. Licensed Physician Responsibility & Sealed Notes
            </h2>
            <p>
              All clinical evaluations, ICD-10 diagnostic codes, and digital prescriptions are authored exclusively by
              licensed healthcare professionals during or after consultation. Every clinical visit note is sealed with an
              immutable cryptographic signature timestamp.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
