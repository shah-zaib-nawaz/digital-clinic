'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DoctorWithDetailsLean } from '@/models/Doctor';
import { DepartmentLean } from '@/models/Department';
import { DoctorAvatar } from '@/components/doctors/doctor-avatar';
import { ClinicUploadWidget } from '@/components/media/clinic-upload-widget';
import { getDepartmentIcon } from '@/components/admin/department-form-dialog';
import {
  getAvailableSlotsAction,
  holdAppointmentSlotAction,
  confirmHeldAppointmentAction,
  releaseHeldSlotAction,
} from '@/actions/appointment.actions';
import { GeneratedSlot } from '@/lib/services/slot-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Download,
  CalendarCheck,
} from 'lucide-react';
import Link from 'next/link';

interface BookingWizardProps {
  doctors: DoctorWithDetailsLean[];
  departments: DepartmentLean[];
  preselectedDoctorId?: string;
}

export function BookingWizard({
  doctors,
  departments,
  preselectedDoctorId,
}: BookingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Step state (1 to 5)
  const [step, setStep] = useState(preselectedDoctorId ? 2 : 1);

  // Selections
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  );
  const [slots, setSlots] = useState<GeneratedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<GeneratedSlot | null>(null);

  // Hold session
  const [heldAppointmentId, setHeldAppointmentId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);

  // Intake data
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  // Confirmed final result
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);

  const selectedDoctor = doctors.find(
    (d) => (d.id || d._id.toString()) === selectedDoctorId
  );

  // 5-Minute Countdown Timer for held slot
  useEffect(() => {
    if (!holdExpiresAt || step >= 5) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((holdExpiresAt - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        toast.error('Your 5-minute hold expired. Please select a time slot again.');
        setHeldAppointmentId(null);
        setHoldExpiresAt(null);
        setSelectedSlot(null);
        setStep(2);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, step]);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    let isSubscribed = true;
    setLoadingSlots(true);

    getAvailableSlotsAction(selectedDoctorId, selectedDate).then((res) => {
      if (!isSubscribed) return;
      setLoadingSlots(false);
      if (res.success && res.data) {
        setSlots(res.data.slots);
      } else {
        setSlots([]);
        toast.error(res.error || 'Failed to query doctor slots');
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [selectedDoctorId, selectedDate]);

  // Handle slot click -> Create 5-minute hold
  const handleSelectSlot = (slot: GeneratedSlot) => {
    if (!slot.isAvailable || isPending) return;

    startTransition(async () => {
      try {
        const res = await holdAppointmentSlotAction({
          doctorId: selectedDoctorId,
          date: selectedDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to hold slot');
          // Refresh slots
          const fresh = await getAvailableSlotsAction(selectedDoctorId, selectedDate);
          if (fresh.success && fresh.data) setSlots(fresh.data.slots);
          return;
        }

        const appt = res.data;
        setHeldAppointmentId(appt.id || (appt as any)._id?.toString());
        setSelectedSlot(slot);

        const expires = appt.heldUntil ? new Date(appt.heldUntil).getTime() : Date.now() + 300000;
        setHoldExpiresAt(expires);
        setRemainingSeconds(Math.floor((expires - Date.now()) / 1000));

        toast.success('Slot reserved for 5 minutes! Complete your details below.');
        setStep(3);
      } catch (err) {
        toast.error('An error occurred holding the slot');
      }
    });
  };

  // Final Confirmation
  const handleConfirmBooking = () => {
    if (!heldAppointmentId) return;

    startTransition(async () => {
      try {
        const res = await confirmHeldAppointmentAction({
          appointmentId: heldAppointmentId,
          chiefComplaint,
          attachmentUrls: attachments,
        });

        if (!res.success || !res.data) {
          toast.error(res.error || 'Failed to confirm booking');
          return;
        }

        setConfirmedAppointment(res.data);
        setStep(5);
        toast.success('Appointment confirmed successfully!');
      } catch (err) {
        toast.error('Failed to confirm booking');
      }
    });
  };

  const handleCancelHold = () => {
    if (heldAppointmentId) {
      releaseHeldSlotAction(heldAppointmentId);
    }
    setHeldAppointmentId(null);
    setHoldExpiresAt(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadIcs = () => {
    if (!confirmedAppointment || !selectedDoctor) return;
    const docName = selectedDoctor.user?.name || 'Physician';
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Digital Clinic//Appointment System//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Medical Consultation with ${docName}`,
      `DESCRIPTION:Clinical appointment at Digital Clinic. Chief complaint: ${chiefComplaint || 'Routine Visit'}`,
      `DTSTART:${selectedDate.replace(/-/g, '')}T${selectedSlot?.startTime.replace(':', '')}00Z`,
      `DTEND:${selectedDate.replace(/-/g, '')}T${selectedSlot?.endTime.replace(':', '')}00Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment-${selectedDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 5-Step Progress Stepper */}
      <div className="border rounded-2xl p-4 bg-card shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          {[
            { num: 1, label: 'Select Physician' },
            { num: 2, label: 'Date & Time' },
            { num: 3, label: 'Clinical Intake' },
            { num: 4, label: 'Review & Lock' },
            { num: 5, label: 'Confirmed' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 ${
                step === s.num
                  ? 'text-primary font-bold'
                  : step > s.num
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.num
                    ? 'bg-primary text-primary-foreground'
                    : step > s.num
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating 5-minute Hold Banner (Visible in steps 3 and 4) */}
      {holdExpiresAt && step >= 3 && step < 5 && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400" />
            <span>
              Temporary slot lock active. Slot held for{' '}
              <span className="font-mono font-bold text-sm">
                {formatTimer(remainingSeconds)}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancelHold}
            className="text-xs text-amber-700 dark:text-amber-300 underline hover:no-underline"
          >
            Release Hold
          </button>
        </div>
      )}

      {/* STEP 1: Select Physician */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Select a Physician</h2>
            <p className="text-xs text-muted-foreground">
              Choose the doctor you would like to book a consultation with.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => {
              const docId = doc.id || doc._id.toString();
              const isSelected = selectedDoctorId === docId;
              const Icon = getDepartmentIcon(doc.department?.iconName || 'Activity');

              return (
                <div
                  key={docId}
                  onClick={() => {
                    setSelectedDoctorId(docId);
                    setStep(2);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <DoctorAvatar
                      avatarUrl={doc.avatarUrl || doc.user?.image}
                      name={doc.user?.name || 'Physician'}
                      size="md"
                      isAcceptingPatients={doc.isAcceptingPatients}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground truncate">
                          {doc.user?.name}
                        </h4>
                        <span className="text-xs font-bold text-foreground">
                          ${doc.consultationFee}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.specialization}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-2 gap-1">
                        <Icon className="h-3 w-3 text-primary" />
                        {doc.department?.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Date & Available Time Slots */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DoctorAvatar
                avatarUrl={selectedDoctor.avatarUrl || selectedDoctor.user?.image}
                name={selectedDoctor.user?.name || 'Physician'}
                size="md"
              />
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {selectedDoctor.user?.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedDoctor.specialization} • ${selectedDoctor.consultationFee} / session
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">
              Change Doctor
            </Button>
          </div>

          {/* Date Picker Input */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <Label htmlFor="visit-date" className="text-xs font-semibold">
              Select Appointment Date
            </Label>
            <Input
              id="visit-date"
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs font-mono text-sm"
            />
          </div>

          {/* Slots Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Available Time Slots ({selectedDate})</span>
              {loadingSlots && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </h4>

            {loadingSlots ? (
              <div className="p-8 text-center border rounded-xl bg-card">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Checking live physician schedule...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl bg-card">
                <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-foreground">
                  No slots available on this date
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The doctor is either off duty or all slots are already booked. Please choose another date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {slots.map((slot) => {
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!slot.isAvailable || isPending}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-2.5 rounded-lg border text-xs font-mono transition-all flex flex-col items-center justify-center gap-0.5 ${
                        slot.isAvailable
                          ? 'bg-card hover:border-primary hover:bg-primary/5 text-foreground cursor-pointer shadow-2xs'
                          : slot.status === 'held'
                          ? 'bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300 cursor-not-allowed opacity-75'
                          : 'bg-muted/40 border-muted text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="font-bold">{slot.startTime}</span>
                      <span className="text-[10px] opacity-75">
                        {slot.isAvailable ? 'Available' : slot.status === 'held' ? 'Held' : 'Booked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Clinical Intake & Document Attachment */}
      {step === 3 && selectedDoctor && selectedSlot && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Clinical Intake Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Providing medical background helps your physician prepare ahead of your consultation.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-card space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="complaint">Reason for Visit / Chief Complaint</Label>
              <Textarea
                id="complaint"
                rows={4}
                placeholder="Describe your current symptoms, how long they have been present, and any medications you are currently taking..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Attach Medical Documents / Prior Labs (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Upload relevant lab results, previous diagnoses, or insurance card copies (PDF/JPG).
              </p>

              <ClinicUploadWidget
                preset="clinic_medical_docs"
                label="Upload Medical Document"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onUploadComplete={(res) => {
                  if (res.secureUrl) {
                    setAttachments((prev) => [...prev, res.secureUrl]);
                  }
                }}
              />

              {attachments.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <p className="text-xs font-semibold text-foreground">Attached Files ({attachments.length}):</p>
                  {attachments.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground truncate p-2 border rounded-md">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{url}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Slots
            </Button>
            <Button onClick={() => setStep(4)} className="gap-2">
              Proceed to Review <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Lock Confirmation */}
      {step === 4 && selectedDoctor && selectedSlot && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Review & Confirm Appointment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please review your consultation details before finalizing your slot.
            </p>
          </div>

          <div className="border rounded-2xl p-6 bg-card shadow-xs space-y-6">
            {/* Doctor info */}
            <div className="flex items-center gap-4 border-b pb-4">
              <DoctorAvatar
                avatarUrl={selectedDoctor.avatarUrl || selectedDoctor.user?.image}
                name={selectedDoctor.user?.name || 'Physician'}
                size="lg"
              />
              <div>
                <h3 className="font-bold text-lg text-foreground">{selectedDoctor.user?.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedDoctor.specialization}</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  License: {selectedDoctor.licenseNumber}
                </p>
              </div>
            </div>

            {/* Visit Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">Date</span>
                <span className="font-semibold text-foreground">{selectedDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Time Window</span>
                <span className="font-semibold text-foreground font-mono">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Format</span>
                <span className="font-semibold text-foreground">In-Person & Telehealth</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Consultation Fee</span>
                <span className="font-bold text-foreground text-sm">
                  ${selectedDoctor.consultationFee}
                </span>
              </div>
            </div>

            {/* Complaint */}
            {chiefComplaint && (
              <div className="border-t pt-4 text-xs space-y-1">
                <span className="text-muted-foreground block font-medium">Chief Complaint</span>
                <p className="text-foreground bg-muted/30 p-3 rounded-lg leading-relaxed">
                  {chiefComplaint}
                </p>
              </div>
            )}

            {/* Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 text-xs text-muted-foreground border border-primary/20">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Free cancellation up to 4 hours before your scheduled time. Your slot is protected with a 5-minute database lock.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(3)} disabled={isPending}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={isPending}
              className="gap-2 shadow-sm font-semibold h-11 px-6"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm Consultation
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Booking Confirmed */}
      {step === 5 && (
        <div className="border rounded-3xl p-8 bg-card text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              Appointment Confirmed
            </Badge>
            <h2 className="text-2xl font-extrabold text-foreground">
              You're All Set!
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your consultation has been locked and confirmed on the physician's daily queue. A confirmation record is stored in your medical portal.
            </p>
          </div>

          {confirmedAppointment && (
            <div className="p-4 rounded-xl bg-muted/40 max-w-sm mx-auto text-xs space-y-2 font-mono text-muted-foreground">
              <div className="flex justify-between">
                <span>Appointment Ref:</span>
                <span className="font-bold text-foreground">
                  {confirmedAppointment.id || (confirmedAppointment as any)._id?.toString()?.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="text-foreground">
                  {selectedDate} at {selectedSlot?.startTime}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button variant="outline" onClick={downloadIcs} className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" /> Download Calendar Invite (.ics)
            </Button>
            <Link href="/patient/appointments" className="w-full sm:w-auto">
              <Button className="gap-2 w-full sm:w-auto shadow-sm">
                <CalendarCheck className="h-4 w-4" /> View My Appointments
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
