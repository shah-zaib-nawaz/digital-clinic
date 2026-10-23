import { z } from 'zod';

export const joinSessionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
});

export const sendSignalSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  targetRole: z.enum(['doctor', 'patient']),
  signal: z.object({
    type: z.enum(['offer', 'answer', 'ice-candidate', 'participant-joined', 'participant-left', 'call-ended', 'chat-message']),
    sdp: z.any().optional(),
    candidate: z.any().optional(),
    message: z.string().optional(),
    senderName: z.string().optional(),
    timestamp: z.number().optional(),
  }),
});

export const concludeSessionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notesSummary: z.string().max(1000).optional(),
});

export const joinSessionSchemaCompiled = z.compile(joinSessionSchema);
export const sendSignalSchemaCompiled = z.compile(sendSignalSchema);
export const concludeSessionSchemaCompiled = z.compile(concludeSessionSchema);

export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type SendSignalInput = z.infer<typeof sendSignalSchema>;
export type ConcludeSessionInput = z.infer<typeof concludeSessionSchema>;
