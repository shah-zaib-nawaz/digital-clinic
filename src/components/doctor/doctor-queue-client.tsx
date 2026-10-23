'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppointmentWithDetailsLean } from '@/models/Appointment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  FileText,
  Phone,
  FileCheck,
  Play,
  Calendar,
} from 'lucide-react';
import { SoapNoteDialog } from '@/components/clinical/soap-note-dialog';

interface DoctorQueueClientProps {
  initialQueue: AppointmentWithDetailsLean[];
}

export function DoctorQueueClient({ initialQueue }: DoctorQueueClientProps) {
  const router = useRouter();
  const [queue] = useState<AppointmentWithDetailsLean[]>(initialQueue);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeAppointment, setActiveAppointment] = useState<{
    id: string;
    patientName: string;
  } | null>(null);

  const filtered = queue.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const confirmedCount = queue.filter((a) => a.status === 'confirmed').length;
  const completedCount = queue.filter((a) => a.status === 'completed').length;
  const cancelledCount = queue.filter((a) => a.status === 'cancelled').length;
  const noshowCount = queue.filter((a) => a.status === 'no-show').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Today's Consultation Queue
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time patient flow, intake documentation, and clinical visit status.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Scheduled Today</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {queue.length} Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">Today's active roster</div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Pending / Confirmed</CardDescription>
            <CardTitle className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {confirmedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">Awaiting consultation</div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Completed</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {completedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">Visits concluded</div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">No-Shows / Cancelled</CardDescription>
            <CardTitle className="text-2xl font-bold text-muted-foreground">
              {noshowCount + cancelledCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs text-muted-foreground">{noshowCount} no-shows recorded</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        {[
          { id: 'all', label: `All (${queue.length})` },
          { id: 'confirmed', label: `Upcoming (${confirmedCount})` },
          { id: 'completed', label: `Completed (${completedCount})` },
          { id: 'cancelled', label: `Cancelled (${cancelledCount})` },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filterStatus === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterStatus(tab.id)}
            className="text-xs h-8"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Queue List */}
      {filtered.length === 0 ? (
        <div className="border border-dashed rounded-3xl p-12 text-center bg-card">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
          <h3 className="font-semibold text-sm text-foreground">
            No patients currently in this queue view
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patients who book consultations for today will automatically stream here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => {
            const apptId = appt.id || appt._id.toString();
            const patientName = appt.patient?.user?.name || 'Patient';
            const patientEmail = appt.patient?.user?.email;
            const patientPhone = appt.patient?.user?.phone || appt.patient?.emergencyContact?.phone;

            return (
              <div
                key={apptId}
                className="p-5 rounded-2xl border bg-card text-card-foreground shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="font-bold text-sm">{appt.startTime}</span>
                      <span className="text-[10px] text-muted-foreground">{appt.endTime}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-foreground">{patientName}</h4>
                        <Badge
                          variant={
                            appt.status === 'confirmed'
                              ? 'default'
                              : appt.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {appt.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                        {patientEmail && <span>{patientEmail}</span>}
                        {patientPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3" /> {patientPhone}
                          </span>
                        )}
                        {appt.patient?.bloodType && (
                          <Badge variant="outline" className="text-[10px]">
                            Blood: {appt.patient.bloodType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {appt.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="gap-1.5 h-8 text-xs shadow-2xs bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() =>
                          setActiveAppointment({
                            id: apptId,
                            patientName,
                          })
                        }
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Start Consultation
                      </Button>
                    )}

                    {appt.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8 text-xs"
                        onClick={() =>
                          setActiveAppointment({
                            id: apptId,
                            patientName,
                          })
                        }
                      >
                        <FileCheck className="h-3.5 w-3.5 text-emerald-600" /> View / Amend Note
                      </Button>
                    )}
                  </div>
                </div>

                {/* Complaint & Attachments */}
                {appt.chiefComplaint && (
                  <div className="bg-muted/30 p-3 rounded-xl text-xs text-muted-foreground border">
                    <span className="font-semibold text-foreground mr-1">Chief Complaint:</span>
                    {appt.chiefComplaint}
                  </div>
                )}

                {appt.attachmentUrls && appt.attachmentUrls.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Patient Attachments ({appt.attachmentUrls.length}):</span>
                    {appt.attachmentUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <FileText className="h-3 w-3" /> Document #{idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive SOAP Note Dialog */}
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
