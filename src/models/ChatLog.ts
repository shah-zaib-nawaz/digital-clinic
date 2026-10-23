import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';

export type TriageUrgency = 'low' | 'medium' | 'high' | 'emergency';
export type ChatSessionStatus = 'active' | 'completed' | 'abandoned';

export interface IChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolInvocations?: any[];
}

export interface ITriageSummary {
  departmentSlug?: string;
  urgency?: TriageUrgency;
  recommendedDoctorId?: Types.ObjectId;
  chiefComplaint?: string;
  symptoms?: string[];
}

export interface IChatLog {
  sessionId: string;
  userId?: Types.ObjectId | null;
  status: ChatSessionStatus;
  messages: IChatMessage[];
  triageSummary?: ITriageSummary;
  isEscalated: boolean;
  escalationReason?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatLogLean = IChatLog & {
  _id: Types.ObjectId;
  id: string;
};

export interface IChatLogMethods {
  softDelete(): Promise<IChatLog>;
  restore(): Promise<IChatLog>;
}

export type ChatLogModel = Model<IChatLog, {}, IChatLogMethods>;

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    toolInvocations: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const triageSummarySchema = new Schema<ITriageSummary>(
  {
    departmentSlug: { type: String, trim: true },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'low',
    },
    recommendedDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    chiefComplaint: { type: String, trim: true },
    symptoms: [{ type: String, trim: true }],
  },
  { _id: false }
);

const chatLogSchema = new Schema<IChatLog, ChatLogModel, IChatLogMethods>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
      index: true,
    },
    messages: [chatMessageSchema],
    triageSummary: triageSummarySchema,
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'chat_logs',
  }
);

// Indexes for telemetry and audits
chatLogSchema.index({ createdAt: -1, isEscalated: 1 });
chatLogSchema.index({ 'triageSummary.urgency': 1, createdAt: -1 });

chatLogSchema.plugin(softDeletePlugin);

export const ChatLog: ChatLogModel =
  (mongoose.models.ChatLog as ChatLogModel) ||
  model<IChatLog, ChatLogModel>('ChatLog', chatLogSchema);
