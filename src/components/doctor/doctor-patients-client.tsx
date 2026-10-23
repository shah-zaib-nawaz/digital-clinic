'use client';

import * as React from 'react';
import {
  Users,
  Search,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DoctorPatientsClientProps {
  patients: any[];
}

export function DoctorPatientsClient({ patients }: DoctorPatientsClientProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = patients.filter((p) => {
    const name = p.userId?.name || '';
    const email = p.userId?.email || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Patient Directory & Clinical Cohort
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse active patients, review chronic health conditions, verify documented allergies, and inspect longitudinal histories.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No patients matched</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search criteria or wait for new appointments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient) => {
            const user = patient.userId;
            const name = user?.name || 'Valued Patient';

            return (
              <div
                key={patient._id.toString()}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-teal-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-bold text-sm">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  {patient.bloodType && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Blood {patient.bloodType}
                    </Badge>
                  )}
                </div>

                {/* Vitals / Demographics Bar */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl border border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Gender</span>
                    <p className="font-semibold text-foreground capitalize">
                      {patient.gender || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Phone</span>
                    <p className="font-semibold text-foreground">
                      {user?.phone || 'Not recorded'}
                    </p>
                  </div>
                </div>

                {/* Allergies & Chronic Conditions */}
                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      Known Allergies
                    </span>
                    {patient.allergies?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy: string) => (
                          <Badge
                            key={allergy}
                            variant="secondary"
                            className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          >
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px] italic">No known allergies</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1 mb-1">
                      <Activity className="h-3 w-3 text-teal-600" />
                      Chronic Conditions
                    </span>
                    {patient.chronicConditions?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.chronicConditions.map((cond: string) => (
                          <Badge
                            key={cond}
                            variant="secondary"
                            className="text-[10px] bg-teal-500/10 text-teal-700 dark:text-teal-400"
                          >
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px] italic">None documented</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
