'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Activity,
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react';
import {
  saveVisitNoteAction,
  createPrescriptionAction,
  getVisitNoteByAppointmentAction,
} from '@/actions/clinical.actions';
import { toast } from 'sonner';

interface SoapNoteDialogProps {
  appointmentId: string;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface MedicationDraft {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refills: number;
}

const COMMON_ICD10_CODES = [
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'R05', description: 'Cough' },
];

export function SoapNoteDialog({
  appointmentId,
  patientName,
  open,
  onOpenChange,
  onSuccess,
}: SoapNoteDialogProps) {
  const [activeTab, setActiveTab] = React.useState('soap');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingNote, setIsLoadingNote] = React.useState(false);

  // SOAP fields
  const [subjective, setSubjective] = React.useState('');
  const [objective, setObjective] = React.useState('');
  const [assessment, setAssessment] = React.useState('');
  const [plan, setPlan] = React.useState('');

  // Vitals
  const [bpSys, setBpSys] = React.useState<number | ''>('');
  const [bpDia, setBpDia] = React.useState<number | ''>('');
  const [hr, setHr] = React.useState<number | ''>('');
  const [temp, setTemp] = React.useState<number | ''>('');
  const [spo2, setSpo2] = React.useState<number | ''>('');
  const [weight, setWeight] = React.useState<number | ''>('');

  // ICD-10
  const [selectedCodes, setSelectedCodes] = React.useState<
    Array<{ code: string; description: string }>
  >([]);

  // Prescriptions
  const [medications, setMedications] = React.useState<MedicationDraft[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = React.useState('');

  React.useEffect(() => {
    if (open && appointmentId) {
      setIsLoadingNote(true);
      getVisitNoteByAppointmentAction(appointmentId)
        .then((res) => {
          if (res.success && res.data) {
            const note = res.data;
            if (note.soap) {
              setSubjective(note.soap.subjective || '');
              setObjective(note.soap.objective || '');
              setAssessment(note.soap.assessment || '');
              setPlan(note.soap.plan || '');
            }
            if (note.vitals) {
              setBpSys(note.vitals.bloodPressureSystolic ?? '');
              setBpDia(note.vitals.bloodPressureDiastolic ?? '');
              setHr(note.vitals.heartRate ?? '');
              setTemp(note.vitals.temperatureCelsius ?? '');
              setSpo2(note.vitals.oxygenSaturation ?? '');
              setWeight(note.vitals.weightKg ?? '');
            }
            if (note.icd10Codes && Array.isArray(note.icd10Codes)) {
              setSelectedCodes(note.icd10Codes);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load existing visit note:', err);
        })
        .finally(() => {
          setIsLoadingNote(false);
        });
    }
  }, [open, appointmentId]);

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        name: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '7 days',
        instructions: 'Take with food',
        refills: 0,
      },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationDraft, value: any) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const toggleIcdCode = (item: { code: string; description: string }) => {
    if (selectedCodes.some((c) => c.code === item.code)) {
      setSelectedCodes((prev) => prev.filter((c) => c.code !== item.code));
    } else {
      setSelectedCodes((prev) => [...prev, item]);
    }
  };

  const handleSave = async (status: 'draft' | 'finalized') => {
    try {
      setIsSubmitting(true);

      const vitals =
        bpSys || bpDia || hr || temp || spo2 || weight
          ? {
              bloodPressureSystolic: bpSys !== '' ? Number(bpSys) : undefined,
              bloodPressureDiastolic: bpDia !== '' ? Number(bpDia) : undefined,
              heartRate: hr !== '' ? Number(hr) : undefined,
              temperatureCelsius: temp !== '' ? Number(temp) : undefined,
              oxygenSaturation: spo2 !== '' ? Number(spo2) : undefined,
              weightKg: weight !== '' ? Number(weight) : undefined,
            }
          : undefined;

      const noteRes = await saveVisitNoteAction({
        appointmentId,
        soap: {
          subjective,
          objective,
          assessment,
          plan,
        },
        vitals,
        icd10Codes: selectedCodes,
        status,
      });

      if (!noteRes.success) {
        toast.error(noteRes.error || 'Failed to save visit note');
        return;
      }

      // If medications were drafted, save prescription
      const validMeds = medications.filter((m) => m.name.trim() && m.dosage.trim());
      if (validMeds.length > 0) {
        const presRes = await createPrescriptionAction({
          appointmentId,
          visitNoteId: noteRes.data?._id?.toString() || noteRes.data?.id,
          medications: validMeds,
          notes: prescriptionNotes,
        });

        if (!presRes.success) {
          toast.warning('Note saved, but prescription encountered an error: ' + presRes.error);
        }
      }

      toast.success(
        status === 'finalized'
          ? 'Clinical note finalized and signed! Patient notified.'
          : 'Visit note draft saved.'
      );

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Error saving clinical note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  SOAP Clinical Documentation
                  {isLoadingNote && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Patient: <span className="font-semibold text-foreground">{patientName}</span>
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Outpatient Encounter
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="soap" className="text-xs gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              SOAP Note
            </TabsTrigger>
            <TabsTrigger value="vitals" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Vitals & Diagnostic Codes
            </TabsTrigger>
            <TabsTrigger value="prescription" className="text-xs gap-1.5">
              <Pill className="h-3.5 w-3.5" />
              Digital Rx ({medications.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SOAP */}
          <TabsContent value="soap" className="space-y-4 pt-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">
                S — Subjective (Chief Complaint & History of Present Illness)
              </Label>
              <Textarea
                placeholder="Patient states symptoms began 3 days ago with worsening throat pain and mild cough..."
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">
                O — Objective (Physical Exam & Findings)
              </Label>
              <Textarea
                placeholder="Alert and oriented x3. Oropharynx mildly erythematous without tonsillar exudates. Lungs clear to auscultation bilaterally..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">
                A — Assessment (Clinical Impression / Diagnosis)
              </Label>
              <Textarea
                placeholder="Acute viral pharyngitis with mild secondary cough. No red-flag signs of peritonsillar abscess..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">
                P — Plan (Treatment, Prescriptions & Follow-up)
              </Label>
              <Textarea
                placeholder="Supportive hydration, warm saline gargles, digital prescription issued below. Return if fever exceeds 38.5C or difficulty breathing develops..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>
          </TabsContent>

          {/* TAB 2: Vitals & ICD-10 */}
          <TabsContent value="vitals" className="space-y-4 pt-3">
            <div>
              <Label className="text-xs font-semibold text-foreground">Vital Signs Snapshot</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div>
                  <span className="text-[11px] text-muted-foreground">Systolic BP (mmHg)</span>
                  <Input
                    type="number"
                    placeholder="120"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value ? Number(e.target.value) : '')}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Diastolic BP (mmHg)</span>
                  <Input
                    type="number"
                    placeholder="80"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value ? Number(e.target.value) : '')}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Heart Rate (bpm)</span>
                  <Input
                    type="number"
                    placeholder="72"
                    value={hr}
                    onChange={(e) => setHr(e.target.value ? Number(e.target.value) : '')}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Temperature (°C)</span>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.8"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value ? Number(e.target.value) : '')}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Oxygen Saturation (SpO2 %)</span>
                  <Input
                    type="number"
                    placeholder="98"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Weight (kg)</span>
                  <Input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <Label className="text-xs font-semibold text-foreground">
                ICD-10 Diagnostic Coding
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Select clinical diagnostic classifications:
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_ICD10_CODES.map((item) => {
                  const isSelected = selectedCodes.some((c) => c.code === item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => toggleIcdCode(item)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="font-mono font-bold">{item.code}</span>
                      <span className="text-[11px] opacity-90 truncate max-w-[200px]">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Digital Prescription */}
          <TabsContent value="prescription" className="space-y-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Prescribed Medications
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Digital prescriptions will be stored and viewable in the patient portal.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={addMedication}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Medication
              </Button>
            </div>

            {medications.length === 0 ? (
              <div className="p-6 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                No medications added. Click "Add Medication" above if a prescription is required.
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Item #{index + 1}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMedication(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Drug Name</span>
                        <Input
                          placeholder="e.g. Amoxicillin"
                          value={med.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Dosage</span>
                        <Input
                          placeholder="e.g. 500mg"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Frequency</span>
                        <Input
                          placeholder="e.g. Every 8 hours"
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Duration</span>
                        <Input
                          placeholder="e.g. 7 days"
                          value={med.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Refills</span>
                        <Input
                          type="number"
                          min={0}
                          value={med.refills}
                          onChange={(e) =>
                            updateMedication(index, 'refills', Number(e.target.value) || 0)
                          }
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Instructions</span>
                        <Input
                          placeholder="e.g. Take with food"
                          value={med.instructions}
                          onChange={(e) =>
                            updateMedication(index, 'instructions', e.target.value)
                          }
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Label className="text-xs font-semibold text-foreground">Pharmacist Notes</Label>
                  <Input
                    placeholder="Special instructions for dispensing pharmacy..."
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSave('draft')}
              disabled={isSubmitting}
              className="text-xs gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save Draft
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSave('finalized')}
              disabled={isSubmitting}
              className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Finalize & Sign Note
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
