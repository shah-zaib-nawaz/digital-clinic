import { EventEmitter } from 'events';

declare global {
  var _clinicSignalingBus: EventEmitter | undefined;
}

export const signalingBus: EventEmitter =
  globalThis._clinicSignalingBus || new EventEmitter();

if (!globalThis._clinicSignalingBus) {
  signalingBus.setMaxListeners(300);
  globalThis._clinicSignalingBus = signalingBus;
}

export interface WebRTCSignalPayload {
  appointmentId: string;
  senderRole: 'doctor' | 'patient';
  targetRole: 'doctor' | 'patient';
  signal: {
    type: 'offer' | 'answer' | 'ice-candidate' | 'participant-joined' | 'participant-left' | 'call-ended' | 'chat-message';
    sdp?: any;
    candidate?: any;
    message?: string;
    senderName?: string;
    timestamp?: number;
  };
}

export function emitTelehealthSignal(payload: WebRTCSignalPayload) {
  const eventName = `signal:${payload.appointmentId}:${payload.targetRole}`;
  signalingBus.emit(eventName, payload);
}
