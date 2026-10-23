'use client';

import * as React from 'react';

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export interface UseWebRTCOptions {
  appointmentId: string;
  role: 'doctor' | 'patient';
  userName?: string;
  onCallEnded?: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC({
  appointmentId,
  role,
  userName = 'Participant',
  onCallEnded,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = React.useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = React.useState(false);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [peerConnected, setPeerConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState<
    'idle' | 'waiting' | 'connecting' | 'connected' | 'ended' | 'error'
  >('idle');
  const [isPeerPresent, setIsPeerPresent] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const sseRef = React.useRef<EventSource | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenTrackRef = React.useRef<MediaStreamTrack | null>(null);

  const targetRole: 'doctor' | 'patient' = role === 'doctor' ? 'patient' : 'doctor';

  // Helper to send signals over HTTP POST
  const sendSignal = React.useCallback(
    async (signal: any) => {
      try {
        await fetch('/api/telehealth/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId,
            targetRole,
            signal,
          }),
        });
      } catch (err) {
        console.error('Failed to dispatch WebRTC signal:', err);
      }
    },
    [appointmentId, targetRole]
  );

  // Initialize or get RTCPeerConnection
  const getOrCreatePeerConnection = React.useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate,
          senderName: userName,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setPeerConnected(true);
        setConnectionState('connected');
      } else if (state === 'disconnected' || state === 'failed') {
        setPeerConnected(false);
      }
    };

    // Attach any already initialized local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [sendSignal, userName]);

  // Initiate WebRTC Call Offer (Doctors typically initiate, but peers can initiate upon participant-joined)
  const createAndSendOffer = React.useCallback(async () => {
    try {
      const pc = getOrCreatePeerConnection();
      setConnectionState('connecting');

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      await sendSignal({
        type: 'offer',
        sdp: offer,
        senderName: userName,
      });
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
      setConnectionState('error');
    }
  }, [getOrCreatePeerConnection, sendSignal, userName]);

  // Handle incoming remote signals
  const handleRemoteSignal = React.useCallback(
    async (signal: any) => {
      if (!signal || !signal.type) return;

      const pc = getOrCreatePeerConnection();

      switch (signal.type) {
        case 'participant-joined':
          setIsPeerPresent(true);
          // If we are doctor, initiate offer upon patient arrival
          if (role === 'doctor') {
            await createAndSendOffer();
          }
          break;

        case 'participant-left':
          setIsPeerPresent(false);
          setPeerConnected(false);
          break;

        case 'offer':
          try {
            setIsPeerPresent(true);
            setConnectionState('connecting');
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await sendSignal({
              type: 'answer',
              sdp: answer,
              senderName: userName,
            });
          } catch (err) {
            console.error('Error processing remote offer:', err);
          }
          break;

        case 'answer':
          try {
            if (pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            }
          } catch (err) {
            console.error('Error processing remote answer:', err);
          }
          break;

        case 'ice-candidate':
          try {
            if (signal.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          } catch (err) {
            console.error('Error adding remote ICE candidate:', err);
          }
          break;

        case 'chat-message':
          if (signal.message) {
            setMessages((prev) => [
              ...prev,
              {
                sender: signal.senderName || 'Peer',
                message: signal.message,
                timestamp: signal.timestamp || Date.now(),
              },
            ]);
          }
          break;

        case 'call-ended':
          setConnectionState('ended');
          setPeerConnected(false);
          onCallEnded?.();
          break;
      }
    },
    [createAndSendOffer, getOrCreatePeerConnection, onCallEnded, role, sendSignal, userName]
  );

  // Initialize Media Devices (Camera & Microphone)
  const initializeMedia = React.useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Add tracks to existing PC if created
      if (pcRef.current) {
        stream.getTracks().forEach((track) => {
          pcRef.current?.addTrack(track, stream);
        });
      }

      setConnectionState('waiting');
    } catch (err) {
      console.warn('Unable to access video/audio devices (permissions or hardware):', err);
      setConnectionState('waiting');
    }
  }, []);

  // Initialize SSE Signal Stream
  React.useEffect(() => {
    let sse: EventSource | null = null;

    initializeMedia().then(() => {
      const sseUrl = `/api/telehealth/signal?appointmentId=${appointmentId}&role=${role}`;
      sse = new EventSource(sseUrl);
      sseRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRemoteSignal(data);
        } catch (err) {
          console.error('Error parsing SSE signal:', err);
        }
      };

      sse.onerror = () => {
        // SSE reconnection handles gracefully
      };
    });

    return () => {
      if (sse) sse.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [appointmentId, handleRemoteSignal, initializeMedia, role]);

  // Audio Toggle
  const toggleAudio = React.useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsAudioMuted(!nextState);
      }
    }
  }, []);

  // Video Toggle
  const toggleVideo = React.useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((t) => (t.enabled = nextState));
        setIsVideoDisabled(!nextState);
      }
    }
  }, []);

  // Screen Sharing Toggle
  const toggleScreenShare = React.useCallback(async () => {
    if (!pcRef.current) return;

    if (isScreenSharing && screenTrackRef.current) {
      // Revert to camera
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);

      if (localStreamRef.current) {
        const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender && camVideoTrack) {
          sender.replaceTrack(camVideoTrack);
        }
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        setIsScreenSharing(true);

        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current) {
            const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
            if (sender && camVideoTrack) sender.replaceTrack(camVideoTrack);
          }
        };
      } catch (err) {
        console.warn('Screen share cancelled or not allowed:', err);
      }
    }
  }, [isScreenSharing]);

  // Send In-Call Chat Message
  const sendChatMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const msg: ChatMessage = {
        sender: userName,
        message: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);

      await sendSignal({
        type: 'chat-message',
        message: text.trim(),
        senderName: userName,
        timestamp: msg.timestamp,
      });
    },
    [sendSignal, userName]
  );

  return {
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    isScreenSharing,
    peerConnected,
    connectionState,
    isPeerPresent,
    messages,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendChatMessage,
    initiateCall: createAndSendOffer,
  };
}
