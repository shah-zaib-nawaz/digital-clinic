'use client';

import * as React from 'react';
import {
  FileText,
  Pill,
  Calendar,
  Activity,
  AlertCircle,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PatientRecordsClientProps {
  data: {
    patient: any;
    appointments: any[];
    notes: any[];
    prescriptions: any[];
  };
}

export function PatientRecordsClient({ data }: PatientRecordsClientProps) {
  const { patient, appointments, notes, prescriptions } = data;
  const [expandedNoteId, setExpandedNoteId] = React.useState<string | null>(
    notes.length > 0 ? notes[0]._id : null
  );

  const toggleNote = (id: string) => {
    setExpandedNoteId((prev) => (prev === id ? null : id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Medical Records & Consultation Summaries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access your signed clinical visit notes, vital signs history, and digital prescriptions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 self-start sm:self-auto"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Print / Export Chart
        </Button>
      </div>

      {/* Patient Intake Summary Card */}
      {patient && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {patient.userId?.name || 'Valued Patient'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Record ID: <span className="font-mono">{patient._id.slice(-8).toUpperCase()}</span> • Gender: {patient.gender || 'Not specified'}
              </p>
            </div>
            {patient.bloodType && (
              <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
                Blood Group: {patient.bloodType}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                Documented Allergies
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
                <span className="text-muted-foreground italic text-[11px]">No known drug allergies</span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <Activity className="h-3 w-3 text-primary" />
                Chronic Conditions
              </span>
              {patient.chronicConditions?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {patient.chronicConditions.map((cond: string) => (
                    <Badge
                      key={cond}
                      variant="secondary"
                      className="text-[10px] bg-primary/10 text-primary"
                    >
                      {cond}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic text-[11px]">No chronic conditions documented</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="notes" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Visit Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs gap-1.5">
            <Pill className="h-3.5 w-3.5" />
            Prescriptions ({prescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Encounter Timeline ({appointments.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SOAP Visit Notes */}
        <TabsContent value="notes" className="space-y-4">
          {notes.length === 0 ? (
            <div className="p-12 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
              No finalized visit notes on record. Notes from your physicians will be published here after each consultation.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const doctorName = note.doctorId?.userId?.name
                  ? `Dr. ${note.doctorId.userId.name}`
                  : 'Physician';
                const isExpanded = expandedNoteId === note._id;

                return (
                  <div
                    key={note._id}
                    className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleNote(note._id)}
                      className="w-full text-left p-4.5 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            Consultation with {doctorName}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Date: {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          Finalized & Signed
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 space-y-4 text-xs border-t border-border">
                        {/* Vitals Ribbon */}
                        {note.vitals && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/50">
                            {note.vitals.bloodPressureSystolic && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">BP</span>
                                <p className="font-semibold text-foreground">
                                  {note.vitals.bloodPressureSystolic}/{note.vitals.bloodPressureDiastolic} mmHg
                                </p>
                              </div>
                            )}
                            {note.vitals.heartRate && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">Heart Rate</span>
                                <p className="font-semibold text-foreground">{note.vitals.heartRate} bpm</p>
                              </div>
                            )}
                            {note.vitals.temperatureCelsius && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">Temperature</span>
                                <p className="font-semibold text-foreground">{note.vitals.temperatureCelsius} °C</p>
                              </div>
                            )}
                            {note.vitals.oxygenSaturation && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">SpO2</span>
                                <p className="font-semibold text-foreground">{note.vitals.oxygenSaturation}%</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ICD-10 Diagnostic Codes */}
                        {note.icd10Codes?.length > 0 && (
                          <div>
                            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block mb-1">
                              Diagnostic Codes (ICD-10)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {note.icd10Codes.map((code: any) => (
                                <Badge key={code.code} variant="secondary" className="text-xs">
                                  <span className="font-mono font-bold mr-1">{code.code}</span>
                                  <span>{code.description}</span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SOAP Body */}
                        <div className="space-y-3 pt-1">
                          {note.soap?.subjective && (
                            <div>
                              <span className="font-bold text-foreground">Subjective: </span>
                              <span className="text-muted-foreground leading-relaxed">
                                {note.soap.subjective}
                              </span>
                            </div>
                          )}
                          {note.soap?.objective && (
                            <div>
                              <span className="font-bold text-foreground">Objective: </span>
                              <span className="text-muted-foreground leading-relaxed">
                                {note.soap.objective}
                              </span>
                            </div>
                          )}
                          {note.soap?.assessment && (
                            <div>
                              <span className="font-bold text-foreground">Assessment: </span>
                              <span className="text-muted-foreground leading-relaxed">
                                {note.soap.assessment}
                              </span>
                            </div>
                          )}
                          {note.soap?.plan && (
                            <div>
                              <span className="font-bold text-foreground">Plan: </span>
                              <span className="text-muted-foreground leading-relaxed">
                                {note.soap.plan}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Digital Prescriptions */}
        <TabsContent value="prescriptions" className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="p-12 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
              No digital prescriptions issued yet. Any prescribed medications will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((pres) => {
                const doctorName = pres.doctorId?.userId?.name
                  ? `Dr. ${pres.doctorId.userId.name}`
                  : 'Physician';

                return (
                  <div
                    key={pres._id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Digital Prescription</h4>
                          <p className="text-xs text-muted-foreground">
                            Prescribing Physician: {doctorName} • Issued:{' '}
                            {new Date(pres.issuedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        Rx Validated
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pres.medications.map((med: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-border/70 bg-muted/30 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-sm">{med.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {med.dosage}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Regimen: </span>
                            {med.frequency} for {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Instructions: </span>
                              {med.instructions}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground pt-1">
                            Refills authorized: <span className="font-semibold text-foreground">{med.refills}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    {pres.notes && (
                      <div className="text-xs p-3 rounded-xl bg-muted/20 border border-border/40 text-muted-foreground">
                        <span className="font-semibold text-foreground">Pharmacy Note: </span>
                        {pres.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Encounter Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          {appointments.length === 0 ? (
            <div className="p-12 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
              No previous consultations recorded.
            </div>
          ) : (
            <div className="relative border-l border-border pl-6 space-y-6 my-2 ml-3">
              {appointments.map((appt) => {
                const docUser = appt.doctorId?.userId;
                const docName = docUser?.name ? `Dr. ${docUser.name}` : 'Physician';
                const deptName = appt.doctorId?.departmentId?.name || 'Clinic';

                return (
                  <div key={appt._id} className="relative space-y-1">
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{docName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(appt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        • {appt.startTime}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">{deptName}</p>
                    {appt.chiefComplaint && (
                      <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 mt-1.5">
                        <span className="font-medium">Reason for visit: </span>
                        {appt.chiefComplaint}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
