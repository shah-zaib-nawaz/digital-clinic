'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AvailabilitySlotLean } from '@/models/AvailabilitySlot';
import {
  getDoctorAvailabilityAction,
  updateDoctorWeeklyScheduleAction,
} from '@/actions/availability.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Loader2, Save } from 'lucide-react';

const DAYS_OF_WEEK = [
  { index: 0, name: 'Sunday', short: 'Sun' },
  { index: 1, name: 'Monday', short: 'Mon' },
  { index: 2, name: 'Tuesday', short: 'Tue' },
  { index: 3, name: 'Wednesday', short: 'Wed' },
  { index: 4, name: 'Thursday', short: 'Thu' },
  { index: 5, name: 'Friday', short: 'Fri' },
  { index: 6, name: 'Saturday', short: 'Sat' },
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

interface ScheduleManagerProps {
  doctorId: string;
  initialSlots?: AvailabilitySlotLean[];
  isReadOnly?: boolean;
}

export function ScheduleManager({
  doctorId,
  initialSlots,
  isReadOnly = false,
}: ScheduleManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (initialSlots && initialSlots.length === 7) {
      setSlots(initialSlots);
    } else {
      // Fetch or init default
      startTransition(async () => {
        const res = await getDoctorAvailabilityAction(doctorId);
        if (res.success && res.data) {
          setSlots(res.data);
        }
      });
    }
  }, [doctorId, initialSlots]);

  const calculateDailyCapacity = (start: string, end: string, duration: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (totalMinutes <= 0) return 0;
    return Math.floor(totalMinutes / duration);
  };

  const updateDay = (dayIndex: number, field: string, value: any) => {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayIndex ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = {
          doctorId,
          slots: slots.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDurationMinutes: Number(s.slotDurationMinutes),
            isActive: Boolean(s.isActive),
          })),
        };

        const res = await updateDoctorWeeklyScheduleAction(payload);
        if (!res.success) {
          toast.error(res.error || 'Failed to update schedule');
          return;
        }

        toast.success('Weekly availability schedule published successfully');
        router.refresh();
      } catch (err) {
        toast.error('Failed to save schedule');
      }
    });
  };

  if (slots.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl bg-card">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading weekly availability...</p>
      </div>
    );
  }

  const totalWeeklySlots = slots.reduce((acc, s) => {
    if (!s.isActive) return acc;
    return acc + calculateDailyCapacity(s.startTime, s.endTime, s.slotDurationMinutes);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Schedule Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-primary/5 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Weekly Booking Capacity</h4>
            <p className="text-xs text-muted-foreground">
              Based on active office hours, this provider generates approximately{' '}
              <span className="font-bold text-primary">{totalWeeklySlots} consultation slots</span>{' '}
              each week.
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <Button onClick={handleSave} disabled={isPending} className="gap-2 shrink-0">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Weekly Schedule
          </Button>
        )}
      </div>

      {/* 7 Days Table / Grid */}
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const slot = slots.find((s) => s.dayOfWeek === day.index) || {
            dayOfWeek: day.index,
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMinutes: 30,
            isActive: false,
          };

          const capacity = slot.isActive
            ? calculateDailyCapacity(
                slot.startTime,
                slot.endTime,
                slot.slotDurationMinutes
              )
            : 0;

          return (
            <div
              key={day.index}
              className={`p-4 rounded-xl border transition-all ${
                slot.isActive
                  ? 'bg-card border-border shadow-2xs'
                  : 'bg-muted/30 border-dashed border-border/60 opacity-80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Day title & Switch */}
                <div className="flex items-center gap-4 min-w-[180px]">
                  {!isReadOnly && (
                    <Switch
                      checked={slot.isActive}
                      onCheckedChange={(val) => updateDay(day.index, 'isActive', val)}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{day.name}</p>
                      {slot.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] py-0 px-1.5"
                        >
                          Office Hours
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground text-[10px] py-0 px-1.5"
                        >
                          Day Off
                        </Badge>
                      )}
                    </div>
                    {slot.isActive && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {capacity} slots ({slot.slotDurationMinutes} min each)
                      </p>
                    )}
                  </div>
                </div>

                {/* Hours & Duration Controls (Only if active) */}
                {slot.isActive ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Start:</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        disabled={isReadOnly}
                        onChange={(e) => updateDay(day.index, 'startTime', e.target.value)}
                        className="h-8 w-28 text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">End:</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        disabled={isReadOnly}
                        onChange={(e) => updateDay(day.index, 'endTime', e.target.value)}
                        className="h-8 w-28 text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Slot Length:</Label>
                      <Select
                        value={slot.slotDurationMinutes?.toString() || '30'}
                        disabled={isReadOnly}
                        onValueChange={(val) =>
                          updateDay(day.index, 'slotDurationMinutes', Number(val))
                        }
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOT_DURATIONS.map((dur) => (
                            <SelectItem key={dur} value={dur.toString()}>
                              {dur} mins
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Physician unavailable for bookings on {day.name}s.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
