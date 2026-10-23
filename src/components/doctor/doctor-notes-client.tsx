'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Stethoscope,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SoapNoteDialog } from '@/components/clinical/soap-note-dialog';

interface DoctorNotesClientProps {
  appointments: any[];
  initialAppointmentId?: string;
}

export function DoctorNotesClient({
  appointments: initialAppointments,
  initialAppointmentId,
}: DoctorNotesClientProps) {
  const router = useRouter();
  const [appointments] = React.useState(initialAppointments);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed'>('all');
  const [activeAppointment, setActiveAppointment] = React.useState<{
    id: string;
    patientName: string;
  } | null>(() => {
    if (!initialAppointmentId) return null;
    const match = initialAppointments.find(
      (a) => a._id?.toString() === initialAppointmentId || a.id === initialAppointmentId
    );
    if (!match) return null;
    return {
      id: match._id?.toString() || match.id,
      patientName: match.patientId?.userId?.name || 'Valued Patient',
    };
  });

  const filteredAppointments = appointments.filter((appt) => {
    if (filter === 'pending') return appt.status === 'confirmed';
    if (filter === 'completed') return appt.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            Clinical Charting & SOAP Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Document outpatient encounters, record vital signs, select ICD-10 diagnostic codes, and issue digital prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl">
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('all')}
          >
            All Encounters ({appointments.length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'pending' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('pending')}
          >
            Needs Charting
          </Button>
          <Button
            size="sm"
            variant={filter === 'completed' ? 'default' : 'ghost'}
            className="text-xs h-7"
            onClick={() => setFilter('completed')}
          >
            Signed & Finalized
          </Button>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No encounters found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Appointments scheduled for today or completed visits will appear here for clinical documentation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((appt) => {
            const patientUser = appt.patientId?.userId;
            const patientName = patientUser?.name || 'Valued Patient';
            const isCompleted = appt.status === 'completed';

            return (
              <div
                key={appt._id.toString()}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-teal-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 font-bold text-sm">
                      {patientName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{patientName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {patientUser?.email || 'No email registered'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={isCompleted ? 'secondary' : 'default'}
                    className={`text-[10px] capitalize ${
                      isCompleted ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''
                    }`}
                  >
                    {isCompleted ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Signed
                      </span>
                    ) : (
                      'In Progress'
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-3 rounded-xl border border-border/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-teal-600" />
                    <span>
                      {new Date(appt.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    <span>
                      {appt.startTime} - {appt.endTime}
                    </span>
                  </div>
                  {appt.chiefComplaint && (
                    <div className="col-span-2 pt-1 border-t border-border/40 text-muted-foreground">
                      <span className="font-medium text-foreground">Complaint: </span>
                      {appt.chiefComplaint}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={isCompleted ? 'outline' : 'default'}
                    className={`text-xs gap-1.5 ${
                      !isCompleted ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''
                    }`}
                    onClick={() =>
                      setActiveAppointment({
                        id: appt._id.toString(),
                        patientName,
                      })
                    }
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    {isCompleted ? 'Review / Amend Chart' : 'Open SOAP Note'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active SOAP Dialog */}
      {activeAppointment && (
        <SoapNoteDialog
          appointmentId={activeAppointment.id}
          patientName={activeAppointment.patientName}
          open={Boolean(activeAppointment)}
          onOpenChange={(open) => !open && setActiveAppointment(null)}
          onSuccess={() => {
            setActiveAppointment(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
