'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  FileText,
  User,
  Pill,
  Clock,
  AlertCircle,
  Stethoscope,
  Send,
  Loader2,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useWebRTC } from '@/hooks/use-webrtc';
import { concludeTelehealthSessionAction } from '@/actions/telehealth.actions';
import {
  saveVisitNoteAction,
  createPrescriptionAction,
  getVisitNoteByAppointmentAction,
} from '@/actions/clinical.actions';

interface DoctorTelehealthCockpitProps {
  appointment: any;
  telehealthSession?: any;
  doctorUser: { id: string; name: string };
}

export function DoctorTelehealthCockpit({
  appointment,
  telehealthSession: _telehealthSession,
  doctorUser,
}: DoctorTelehealthCockpitProps) {
  const router = useRouter();
  const appointmentId = appointment._id || appointment.id;
  const patient = appointment.patientId;
  const patientUser = patient?.userId;
  const patientName = patientUser?.name || 'Patient';

  // WebRTC Hook
  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    isScreenSharing,
    peerConnected,
    isPeerPresent,
    messages,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendChatMessage,
  } = useWebRTC({
    appointmentId,
    role: 'doctor',
    userName: `Dr. ${doctorUser.name}`,
    onCallEnded: () => {
      toast.info('Patient has disconnected from the consultation.');
    },
  });

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);

  // Call timer
  const [callDuration, setCallDuration] = React.useState(0);
  const [isEndingCall, setIsEndingCall] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');

  // Clinical Charting State
  const [activeTab, setActiveTab] = React.useState('charting');
  const [subjective, setSubjective] = React.useState('');
  const [objective, setObjective] = React.useState('');
  const [assessment, setAssessment] = React.useState('');
  const [plan, setPlan] = React.useState('');
  const [bpSys, setBpSys] = React.useState<number | ''>('');
  const [bpDia, setBpDia] = React.useState<number | ''>('');
  const [hr, setHr] = React.useState<number | ''>('');
  const [temp, setTemp] = React.useState<number | ''>('');
  const [spo2, setSpo2] = React.useState<number | ''>('');
  const [weight, setWeight] = React.useState<number | ''>('');
  const [selectedCodes, setSelectedCodes] = React.useState<Array<{ code: string; description: string }>>([]);
  const [isSavingNote, setIsSavingNote] = React.useState(false);

  // Quick Rx State
  const [rxName, setRxName] = React.useState('');
  const [rxDosage, setRxDosage] = React.useState('');
  const [rxFrequency, setRxFrequency] = React.useState('Once daily');
  const [rxDuration, setRxDuration] = React.useState('7 days');
  const [rxRefills, setRxRefills] = React.useState(0);
  const [isSubmittingRx, setIsSubmittingRx] = React.useState(false);

  // Attach local stream
  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration counter
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (peerConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [peerConnected]);

  // Load existing note draft if present
  React.useEffect(() => {
    getVisitNoteByAppointmentAction(appointmentId).then((res) => {
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
        if (note.icd10Codes) setSelectedCodes(note.icd10Codes);
      }
    });
  }, [appointmentId]);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      setIsEndingCall(true);
      await concludeTelehealthSessionAction({
        appointmentId,
        notesSummary: assessment || 'Outpatient telehealth consultation concluded.',
      });
      toast.success('Consultation concluded. You can finalize your clinical notes now.');
    } catch (err: any) {
      toast.error('Error concluding session: ' + err.message);
    } finally {
      setIsEndingCall(false);
    }
  };

  const handleSaveNote = async (status: 'draft' | 'finalized') => {
    try {
      setIsSavingNote(true);
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

      const res = await saveVisitNoteAction({
        appointmentId,
        soap: { subjective, objective, assessment, plan },
        vitals,
        icd10Codes: selectedCodes,
        status,
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to save note');
        return;
      }

      toast.success(
        status === 'finalized'
          ? 'Clinical note sealed and encounter marked completed!'
          : 'Encounter draft saved.'
      );
      if (status === 'finalized') {
        router.push('/doctor');
      }
    } catch (err: any) {
      toast.error('Error saving clinical note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleQuickRx = async () => {
    if (!rxName.trim() || !rxDosage.trim()) {
      toast.error('Medication name and dosage are required.');
      return;
    }

    try {
      setIsSubmittingRx(true);
      const res = await createPrescriptionAction({
        appointmentId,
        medications: [
          {
            name: rxName.trim(),
            dosage: rxDosage.trim(),
            frequency: rxFrequency,
            duration: rxDuration,
            refills: Number(rxRefills) || 0,
          },
        ],
        notes: 'Issued during telehealth consultation.',
      });

      if (!res.success) {
        toast.error(res.error || 'Failed to issue prescription');
        return;
      }

      toast.success(`Prescription for ${rxName} issued!`);
      setRxName('');
      setRxDosage('');
    } catch (err: any) {
      toast.error('Error issuing prescription');
    } finally {
      setIsSubmittingRx(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-card p-3 rounded-2xl border shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                Consultation: {patientName}
              </h2>
              <Badge variant="outline" className="text-[10px]">
                {appointment.startTime} - {appointment.endTime}
              </Badge>
              {peerConnected && (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Video Connected
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Chief Complaint: {appointment.chiefComplaint || 'Routine medical follow-up'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-xl text-xs font-mono font-medium">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatSeconds(callDuration)}</span>
          </div>

          <Button
            size="sm"
            variant="destructive"
            className="text-xs h-8 gap-1.5"
            onClick={handleEndCall}
            disabled={isEndingCall}
          >
            <PhoneOff className="h-3.5 w-3.5" />
            Conclude Call
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left: Video Stage (7 columns) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border bg-black/95 overflow-hidden shadow-sm relative">
          {/* Main Remote Video */}
          <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
            {remoteStream && peerConnected ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-white space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white animate-pulse">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{patientName}</h3>
                  <p className="text-xs text-white/60 mt-1">
                    {isPeerPresent
                      ? 'Establishing encrypted peer connection...'
                      : 'Waiting for patient to enter the consultation room...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Picture-in-Picture Video */}
            <div className="absolute top-4 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-900 shadow-lg z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
              />
              {isVideoDisabled && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white text-[10px]">
                  <VideoOff className="h-5 w-5 mb-1 text-white/60" />
                  Camera Muted
                </div>
              )}
              <div className="absolute bottom-1 left-2 text-[9px] text-white/80 font-medium">
                You (Clinician)
              </div>
            </div>

            {/* Chat Drawer Overlay */}
            {showChat && (
              <div className="absolute inset-y-0 right-0 w-72 bg-card/95 backdrop-blur border-l flex flex-col z-20 shadow-xl">
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">In-Call Room Chat</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={() => setShowChat(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                  {messages.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-8">
                      No messages yet. Send a note to the patient.
                    </p>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {m.sender}
                        </span>
                        <div className="p-2 rounded-xl bg-muted text-foreground">
                          {m.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="p-2 border-t flex gap-1.5">
                  <Input
                    placeholder="Type message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-8 px-2.5">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* In-Call Controls Toolbar */}
          <div className="h-16 bg-zinc-950/90 border-t border-white/10 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant={isAudioMuted ? 'destructive' : 'secondary'}
                size="sm"
                className="h-9 w-9 p-0 rounded-full"
                onClick={toggleAudio}
                title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Button
                variant={isVideoDisabled ? 'destructive' : 'secondary'}
                size="sm"
                className="h-9 w-9 p-0 rounded-full"
                onClick={toggleVideo}
                title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoDisabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>

              <Button
                variant={isScreenSharing ? 'default' : 'secondary'}
                size="sm"
                className="h-9 w-9 p-0 rounded-full"
                onClick={toggleScreenShare}
                title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showChat ? 'default' : 'secondary'}
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat ({messages.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Live Clinical Documentation Workspace (5 columns) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border bg-card overflow-hidden shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b bg-muted/30">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="charting" className="text-xs gap-1">
                  <FileText className="h-3.5 w-3.5" /> SOAP Chart
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs gap-1">
                  <User className="h-3.5 w-3.5" /> Patient EHR
                </TabsTrigger>
                <TabsTrigger value="prescription" className="text-xs gap-1">
                  <Pill className="h-3.5 w-3.5" /> Digital Rx
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Live SOAP Note */}
            <TabsContent value="charting" className="flex-1 p-4 overflow-y-auto space-y-4 m-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-[11px] font-semibold">Subjective (Symptoms / History)</Label>
                  <Textarea
                    placeholder="Patient describes onset of symptoms during video call..."
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    className="mt-1 text-xs h-20 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Objective (Telehealth Exam Findings)</Label>
                  <Textarea
                    placeholder="Visual examination: alert, oriented, no acute distress..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="mt-1 text-xs h-18 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Assessment (Clinical Impression)</Label>
                  <Textarea
                    placeholder="Primary diagnostic assessment..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    className="mt-1 text-xs h-18 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Plan (Treatment & Follow-Up)</Label>
                  <Textarea
                    placeholder="Treatment regimen, lab referrals, and follow-up window..."
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="mt-1 text-xs h-18 resize-none"
                  />
                </div>
              </div>

              {/* Vitals Summary */}
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-2">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground block">
                  Reported / Telehealth Vitals
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">BP Systolic</span>
                    <Input
                      type="number"
                      placeholder="120"
                      value={bpSys}
                      onChange={(e) => setBpSys(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">BP Diastolic</span>
                    <Input
                      type="number"
                      placeholder="80"
                      value={bpDia}
                      onChange={(e) => setBpDia(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Pulse (BPM)</span>
                    <Input
                      type="number"
                      placeholder="72"
                      value={hr}
                      onChange={(e) => setHr(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handleSaveNote('draft')}
                  disabled={isSavingNote}
                >
                  <Save className="h-3.5 w-3.5" /> Save Draft
                </Button>

                <Button
                  size="sm"
                  className="text-xs h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => handleSaveNote('finalized')}
                  disabled={isSavingNote || !assessment.trim()}
                >
                  {isSavingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Finalize & Conclude Visit
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: Patient Health Profile */}
            <TabsContent value="profile" className="flex-1 p-4 overflow-y-auto space-y-4 m-0 text-xs">
              <div className="p-3 rounded-2xl bg-muted/40 border space-y-2">
                <h4 className="font-bold text-foreground text-sm">{patientName}</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Gender: <span className="text-foreground capitalize">{patient?.gender || 'N/A'}</span></div>
                  <div>Blood Group: <span className="text-foreground font-mono">{patient?.bloodType || 'N/A'}</span></div>
                  <div>Phone: <span className="text-foreground font-mono">{patientUser?.phone || 'N/A'}</span></div>
                  <div>Email: <span className="text-foreground">{patientUser?.email || 'N/A'}</span></div>
                </div>
              </div>

              {/* Documented Allergies */}
              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-500" /> Documented Allergies
                </span>
                {patient?.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((a: string) => (
                      <Badge key={a} variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No known drug allergies reported.</p>
                )}
              </div>

              {/* Patient Attachments */}
              {appointment.attachmentUrls && appointment.attachmentUrls.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                    Uploaded Encounter Documents
                  </span>
                  <div className="space-y-1">
                    {appointment.attachmentUrls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline block font-mono text-[11px]"
                      >
                        Encounter Attachment #{idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: Quick Digital Rx */}
            <TabsContent value="prescription" className="flex-1 p-4 overflow-y-auto space-y-4 m-0 text-xs">
              <div className="space-y-3">
                <div>
                  <Label className="text-[11px] font-semibold">Medication Name</Label>
                  <Input
                    placeholder="e.g. Amoxicillin, Lisinopril..."
                    value={rxName}
                    onChange={(e) => setRxName(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] font-semibold">Dosage</Label>
                    <Input
                      placeholder="e.g. 500mg"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Frequency</Label>
                    <Input
                      placeholder="Twice daily"
                      value={rxFrequency}
                      onChange={(e) => setRxFrequency(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] font-semibold">Duration</Label>
                    <Input
                      placeholder="10 days"
                      value={rxDuration}
                      onChange={(e) => setRxDuration(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Refills</Label>
                    <Input
                      type="number"
                      min={0}
                      value={rxRefills}
                      onChange={(e) => setRxRefills(Number(e.target.value))}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white mt-2"
                  onClick={handleQuickRx}
                  disabled={isSubmittingRx || !rxName.trim()}
                >
                  {isSubmittingRx ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Pill className="h-3.5 w-3.5" />
                  )}
                  Issue Prescription
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
