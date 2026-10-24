'use client';

import * as React from 'react';
import { Bot, Sparkles, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AiAssistantPreview() {
  const samplePrompts = [
    {
      label: 'Find Cardiologist',
      query: 'Can you recommend a cardiologist available this Friday?',
      type: 'triage',
    },
    {
      label: 'Emergency Interception',
      query: 'I have sudden crushing chest pain and shortness of breath.',
      type: 'emergency',
    },
    {
      label: 'Hold Slot Approval',
      query: 'Please reserve the 10:00 AM slot with Dr. Jenkins.',
      type: 'hitl',
    },
    {
      label: 'Specialty Guidance',
      query: 'Which department treats chronic eczema flare-ups?',
      type: 'triage',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border bg-gradient-to-br from-indigo-500/5 via-card to-background p-6 sm:p-12 shadow-sm relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Bot className="h-3.5 w-3.5" /> Autonomous Clinical AI Receptionist
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Conversational Triage with Cryptographic Human-in-the-Loop Safety
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Our AI assistant answers outpatient inquiries, matches specialties, checks real-time physician calendars, and intercepts red-flag emergencies (100% 911 escalation rate).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card border">
              <ShieldAlert className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">Emergency Guardrails</strong>
                <span className="text-muted-foreground">Intercepts stroke, cardiac, and trauma symptoms with instant 911 warnings.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-card border">
              <Lock className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block">HMAC-SHA256 HITL Cards</strong>
                <span className="text-muted-foreground">Requires direct patient signature approval before executing any slot reservation.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3 items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Click the floating chat button on the bottom right to talk live!
            </span>
          </div>
        </div>

        {/* Interactive Simulated Assistant Card */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl border bg-card p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Clinic AI Receptionist</h4>
                  <p className="text-[10px] text-emerald-500 font-medium">Online · Verified Vercel AI SDK v7</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                gpt-4o
              </span>
            </div>

            {/* Simulated Chat Message */}
            <div className="space-y-3 text-xs">
              <div className="flex gap-2 items-start">
                <div className="p-2.5 rounded-2xl rounded-tl-xs bg-muted text-muted-foreground max-w-[85%]">
                  Hello! How can I assist with your clinical scheduling today?
                </div>
              </div>

              {/* Simulated HITL Card Preview */}
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Slot Reservation Approval
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">5-min TTL</span>
                </div>
                <div className="text-xs font-medium text-foreground">
                  Dr. Sarah Jenkins · Cardiology Consultation
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Friday, 10:00 AM – 10:30 AM · Fee: $150
                </div>
                <Button size="sm" className="w-full h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                  Approve & Hold Slot (HMAC Verified)
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-medium text-muted-foreground mb-2">Try asking the live assistant:</p>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.slice(0, 3).map((sp, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground border hover:bg-secondary/80 cursor-pointer"
                  >
                    "{sp.label}"
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
