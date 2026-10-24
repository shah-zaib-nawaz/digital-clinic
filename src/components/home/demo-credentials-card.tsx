'use client';

import * as React from 'react';
import Link from 'next/link';
import { Copy, Check, UserCheck, Stethoscope, ShieldCheck, KeyRound, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RoleCred {
  role: string;
  label: string;
  icon: any;
  color: string;
  badge: string;
  email: string;
  pass: string;
  portalUrl: string;
  description: string;
}

const ROLES: RoleCred[] = [
  {
    role: 'patient',
    label: 'Patient Experience',
    icon: UserCheck,
    color: 'from-teal-500/10 to-emerald-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400',
    badge: 'Patient',
    email: 'patient@clinic.test',
    pass: 'Password123!',
    portalUrl: '/patient',
    description: 'Explore verified doctors, test the 5-min TTL booking wizard, and view EHR records.',
  },
  {
    role: 'doctor',
    label: 'Physician Cockpit',
    icon: Stethoscope,
    color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    badge: 'Doctor',
    email: 'doctor@clinic.test',
    pass: 'Password123!',
    portalUrl: '/doctor',
    description: 'Review patient queues, author sealed SOAP clinical notes, and manage availability slots.',
  },
  {
    role: 'admin',
    label: 'Clinical Operations',
    icon: ShieldCheck,
    color: 'from-purple-500/10 to-indigo-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
    badge: 'Admin',
    email: 'admin@clinic.test',
    pass: 'Password123!',
    portalUrl: '/admin',
    description: 'Manage clinic departments, monitor AI spending telemetry, and moderate patient reviews.',
  },
];

export function DemoCredentialsCard() {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <KeyRound className="h-3.5 w-3.5" /> Instant Role Testing Sandbox
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Explore All 4 Healthcare Roles in Seconds
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Pre-seeded test credentials ready to sign in. Click any field to copy, then enter the dedicated portal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map((item) => {
          const Icon = item.icon;
          const isEmailCopied = copiedKey === item.email;
          const isPassCopied = copiedKey === item.pass;

          return (
            <div
              key={item.role}
              className={`rounded-2xl border bg-gradient-to-b ${item.color} p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-background border flex items-center justify-center shadow-xs">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-background border">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div
                    onClick={() => copyToClipboard(item.email, 'Email')}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/80 border hover:bg-background cursor-pointer group transition-colors"
                  >
                    <div className="truncate mr-2">
                      <span className="text-muted-foreground text-[10px] block uppercase font-medium">Email</span>
                      <span className="font-mono text-foreground">{item.email}</span>
                    </div>
                    {isEmailCopied ? (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                    )}
                  </div>

                  <div
                    onClick={() => copyToClipboard(item.pass, 'Password')}
                    className="flex items-center justify-between p-2 rounded-lg bg-background/80 border hover:bg-background cursor-pointer group transition-colors"
                  >
                    <div>
                      <span className="text-muted-foreground text-[10px] block uppercase font-medium">Password</span>
                      <span className="font-mono text-foreground">{item.pass}</span>
                    </div>
                    {isPassCopied ? (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button asChild size="sm" className="w-full rounded-xl gap-1.5 shadow-xs">
                  <Link href="/auth/sign-in">
                    <span>Sign In as {item.badge}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
