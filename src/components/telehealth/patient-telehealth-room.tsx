'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Clock,
  ShieldCheck,
  Stethoscope,
  Send,
  Video as VideoIcon,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useWebRTC } from '@/hooks/use-webrtc';
import { concludeTelehealthSessionAction } from '@/actions/telehealth.actions';

interface PatientTelehealthRoomProps {
  appointment: any;
  telehealthSession?: any;
  patientUser: { id: string; name: string };
}

export function PatientTelehealthRoom({
  appointment,
  telehealthSession: _telehealthSession,
  patientUser,
}: PatientTelehealthRoomProps) {
  const router = useRouter();
  const appointmentId = appointment._id || appointment.id;
  const doctor = appointment.doctorId;
  const doctorUser = doctor?.userId;
  const doctorName = doctorUser?.name || 'Physician';
  const departmentName = doctor?.departmentId?.name || 'Clinical Care';

  const [inWaitingRoom, setInWaitingRoom] = React.useState(true);
  const [callDuration, setCallDuration] = React.useState(0);
  const [showChat, setShowChat] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');

  const {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    peerConnected,
    isPeerPresent,
    messages,
    toggleAudio,
    toggleVideo,
    sendChatMessage,
  } = useWebRTC({
    appointmentId,
    role: 'patient',
    userName: patientUser.name,
    onCallEnded: () => {
      toast.info('Consultation has concluded.');
      router.push('/patient/appointments');
    },
  });

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);

  // Attach local stream
  React.useEffect(() => {
    if (inWaitingRoom && previewVideoRef.current && localStream) {
      previewVideoRef.current.srcObject = localStream;
    } else if (!inWaitingRoom && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [inWaitingRoom, localStream]);

  // Attach remote stream
  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Duration counter
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (peerConnected && !inWaitingRoom) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inWaitingRoom, peerConnected]);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveCall = async () => {
    try {
      await concludeTelehealthSessionAction({
        appointmentId,
        notesSummary: 'Patient left consultation.',
      });
      router.push('/patient/appointments');
    } catch {
      router.push('/patient/appointments');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  // 1. Virtual Waiting Room & Preflight Device Check View
  if (inWaitingRoom) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            HIPAA-Compliant WebRTC Video Room
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Virtual Waiting Room & Camera Check
          </h1>
          <p className="text-sm text-muted-foreground">
            You are checking in for your consultation with Dr. {doctorName} ({departmentName}).
          </p>
        </div>

        {/* Video Preview Box */}
        <div className="rounded-3xl border bg-black/95 overflow-hidden shadow-lg aspect-video relative flex items-center justify-center">
          {localStream ? (
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
            />
          ) : (
            <div className="text-center text-white/60 p-6 space-y-2">
              <VideoIcon className="h-8 w-8 mx-auto animate-pulse" />
              <p className="text-xs">Initializing camera and microphone access...</p>
            </div>
          )}

          {isVideoDisabled && localStream && (
            <div className="text-center text-white space-y-2">
              <VideoOff className="h-10 w-10 mx-auto text-white/60" />
              <p className="text-xs">Camera is muted</p>
            </div>
          )}

          {/* Quick Preflight Controls */}
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
            <Button
              variant={isAudioMuted ? 'destructive' : 'secondary'}
              size="sm"
              className="h-10 w-10 rounded-full p-0 shadow-md"
              onClick={toggleAudio}
            >
              {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              variant={isVideoDisabled ? 'destructive' : 'secondary'}
              size="sm"
              className="h-10 w-10 rounded-full p-0 shadow-md"
              onClick={toggleVideo}
            >
              {isVideoDisabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Status Card & Join Button */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600 font-bold text-sm">
                DR
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Dr. {doctorName}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" /> {departmentName}
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="text-xs">
              Scheduled: {appointment.startTime} - {appointment.endTime}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Camera & Audio Verified</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Peer-to-Peer Encryption</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full text-sm font-semibold h-11 gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            onClick={() => setInWaitingRoom(false)}
          >
            <Video className="h-4 w-4" /> Join Video Consultation
          </Button>
        </div>
      </div>
    );
  }

  // 2. Active Consultation Room View
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-card p-3 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Dr. {doctorName}</h2>
              <Badge variant="outline" className="text-[10px]">
                {departmentName}
              </Badge>
              {peerConnected ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">
                  Waiting for Clinician
                </Badge>
              )}
            </div>
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
            onClick={handleLeaveCall}
          >
            <PhoneOff className="h-3.5 w-3.5" /> Leave Consultation
          </Button>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="flex-1 rounded-3xl border bg-black/95 overflow-hidden shadow-md relative flex items-center justify-center min-h-[400px]">
        {/* Remote Doctor Video */}
        {remoteStream && peerConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 text-white space-y-3">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-600/20 text-teal-400 border border-teal-500/30 animate-pulse">
              <Stethoscope className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-base font-bold">Dr. {doctorName}</h3>
              <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
                {isPeerPresent
                  ? 'Connecting to secure stream...'
                  : 'Your doctor will join the consultation momentarily. Please keep this screen open.'}
              </p>
            </div>
          </div>
        )}

        {/* Local Patient PIP Video */}
        <div className="absolute top-4 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-900 shadow-xl z-10">
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
              Camera Off
            </div>
          )}
          <div className="absolute bottom-1 left-2 text-[9px] text-white/80 font-medium">
            You
          </div>
        </div>

        {/* In-Call Controls Bottom Bar */}
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-3 z-10">
          <Button
            variant={isAudioMuted ? 'destructive' : 'secondary'}
            size="lg"
            className="h-12 w-12 rounded-full p-0 shadow-xl backdrop-blur bg-white/20 hover:bg-white/30 text-white border border-white/20"
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoDisabled ? 'destructive' : 'secondary'}
            size="lg"
            className="h-12 w-12 rounded-full p-0 shadow-xl backdrop-blur bg-white/20 hover:bg-white/30 text-white border border-white/20"
            onClick={toggleVideo}
            title={isVideoDisabled ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoDisabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>

          <Button
            variant={showChat ? 'default' : 'secondary'}
            size="lg"
            className="h-12 w-12 rounded-full p-0 shadow-xl backdrop-blur bg-white/20 hover:bg-white/30 text-white border border-white/20"
            onClick={() => setShowChat(!showChat)}
            title="Chat with Doctor"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Drawer Overlay */}
        {showChat && (
          <div className="absolute inset-y-0 right-0 w-80 bg-card/95 backdrop-blur border-l flex flex-col z-20 shadow-2xl">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Chat with Dr. {doctorName}</span>
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
                <p className="text-[11px] text-muted-foreground text-center py-12">
                  No messages exchanged yet.
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
                placeholder="Type message to doctor..."
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
    </div>
  );
}
