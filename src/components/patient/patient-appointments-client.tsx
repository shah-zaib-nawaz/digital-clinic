'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppointmentWithDetailsLean } from '@/models/Appointment';
import { cancelAppointmentAction } from '@/actions/appointment.actions';
import { DoctorAvatar } from '@/components/doctors/doctor-avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  Loader2,
  FileText,
  CalendarX2,
  Star,
  Video,
} from 'lucide-react';
import { ReviewModal } from '@/components/reviews/review-modal';

interface PatientAppointmentsClientProps {
  initialAppointments: AppointmentWithDetailsLean[];
}

export function PatientAppointmentsClient({
  initialAppointments,
}: PatientAppointmentsClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetailsLean[]>(initialAppointments);
  const [selectedApptForCancel, setSelectedApptForCancel] = useState<AppointmentWithDetailsLean | null>(null);
  const [selectedApptForReview, setSelectedApptForReview] = useState<AppointmentWithDetailsLean | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancelClick = (appt: AppointmentWithDetailsLean) => {
    setSelectedApptForCancel(appt);
    setCancelReason('');
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedApptForCancel) return;

    startTransition(async () => {
      try {
        const apptId = selectedApptForCancel.id || selectedApptForCancel._id.toString();
        const res = await cancelAppointmentAction({
          appointmentId: apptId,
          reason: cancelReason || 'Patient requested cancellation',
        });

        if (!res.success) {
          toast.error(res.error || 'Failed to cancel appointment');
          return;
        }

        setAppointments((prev) =>
          prev.map((a) =>
            (a.id || a._id.toString()) === apptId ? { ...a, status: 'cancelled' } : a
          )
        );

        setIsCancelDialogOpen(false);
        toast.success('Appointment cancelled successfully');
        router.refresh();
      } catch (err) {
        toast.error('An error occurred');
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
            Confirmed
          </Badge>
        );
      case 'held':
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs">
            Pending Hold
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-xs">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Cancelled
          </Badge>
        );
      case 'no-show':
        return (
          <Badge variant="destructive" className="text-xs">
            No-Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Appointments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View scheduled consultations, access intake records, or make adjustments.
          </p>
        </div>

        <Link href="/patient/book">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Book New Visit
          </Button>
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="border border-dashed rounded-3xl p-12 text-center bg-card">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-base text-foreground">
            No consultations scheduled
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            You don't have any upcoming or past medical consultations on record.
          </p>
          <Link href="/patient/book">
            <Button size="sm" className="mt-4 gap-1.5">
              <Plus className="h-4 w-4" /> Book Consultation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const apptId = appt.id || appt._id.toString();
            const docName = appt.doctor?.user?.name || 'Physician';
            const docAvatar = appt.doctor?.avatarUrl || appt.doctor?.user?.image;
            const dateStr = new Date(appt.date).toISOString().split('T')[0];
            const isCancellable = appt.status === 'confirmed' || appt.status === 'held';

            return (
              <div
                key={apptId}
                className="p-5 rounded-2xl border bg-card text-card-foreground shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <DoctorAvatar
                      avatarUrl={docAvatar}
                      name={docName}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-sm">{docName}</h4>
                        {getStatusBadge(appt.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {appt.doctor?.specialization} • {appt.department?.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" /> {appt.startTime} - {appt.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {appt.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                          onClick={() => setSelectedApptForReview(appt)}
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Leave Review
                        </Button>

                        <Link href="/patient/records">
                          <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                            <FileText className="h-3.5 w-3.5" /> Visit Summary
                          </Button>
                        </Link>
                      </>
                    )}

                    {appt.status === 'confirmed' && (
                      <Link href={`/patient/telehealth/${appt.id || appt._id.toString()}`}>
                        <Button
                          size="sm"
                          className="text-xs h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
                        >
                          <Video className="h-3.5 w-3.5" /> Join Telehealth
                        </Button>
                      </Link>
                    )}

                    {isCancellable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelClick(appt)}
                        className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <CalendarX2 className="h-3.5 w-3.5 mr-1" /> Cancel Visit
                      </Button>
                    )}
                  </div>
                </div>

                {appt.chiefComplaint && (
                  <div className="bg-muted/30 p-3 rounded-xl text-xs text-muted-foreground border">
                    <span className="font-semibold text-foreground mr-1">Chief Complaint:</span>
                    {appt.chiefComplaint}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Cancel Consultation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your scheduled appointment with{' '}
              <span className="font-semibold text-foreground">
                {selectedApptForCancel?.doctor?.user?.name}
              </span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              placeholder="Please provide a brief reason (e.g. scheduling conflict, symptoms resolved)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Note: Clinic policy requires cancellations to be made at least 4 hours before the scheduled time.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isPending}
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal Dialog */}
      {selectedApptForReview && (
        <ReviewModal
          appointmentId={selectedApptForReview.id || selectedApptForReview._id.toString()}
          doctorName={selectedApptForReview.doctor?.user?.name || 'Physician'}
          departmentName={selectedApptForReview.department?.name}
          open={Boolean(selectedApptForReview)}
          onOpenChange={(open) => !open && setSelectedApptForReview(null)}
          onSuccess={() => {
            setSelectedApptForReview(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
