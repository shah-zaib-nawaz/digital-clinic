import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import './Patient';
import './Doctor';
import './Appointment';

export interface IVitalSigns {
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  heartRate?: number | null;
  temperatureCelsius?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

export interface IIcd10Code {
  code: string;
  description: string;
}

export interface ISoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export type VisitNoteStatus = 'draft' | 'finalized' | 'amended';

export interface IVisitNote {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  soap: ISoapNote;
  vitals?: IVitalSigns;
  icd10Codes: IIcd10Code[];
  status: VisitNoteStatus;
  finalizedAt?: Date | null;
  amendedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type VisitNoteLean = IVisitNote & {
  _id: Types.ObjectId;
  id: string;
};

export interface IVisitNoteMethods {
  softDelete(): Promise<IVisitNote>;
  restore(): Promise<IVisitNote>;
}

export type VisitNoteModel = Model<IVisitNote, {}, IVisitNoteMethods>;

const vitalSignsSchema = new Schema<IVitalSigns>(
  {
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    heartRate: { type: Number },
    temperatureCelsius: { type: Number },
    respiratoryRate: { type: Number },
    oxygenSaturation: { type: Number },
    weightKg: { type: Number },
    heightCm: { type: Number },
  },
  { _id: false }
);

const icd10CodeSchema = new Schema<IIcd10Code>(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const soapNoteSchema = new Schema<ISoapNote>(
  {
    subjective: { type: String, default: '', trim: true },
    objective: { type: String, default: '', trim: true },
    assessment: { type: String, default: '', trim: true },
    plan: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const visitNoteSchema = new Schema<IVisitNote, VisitNoteModel, IVisitNoteMethods>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    soap: {
      type: soapNoteSchema,
      required: true,
      default: () => ({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      }),
    },
    vitals: vitalSignsSchema,
    icd10Codes: [icd10CodeSchema],
    status: {
      type: String,
      enum: ['draft', 'finalized', 'amended'],
      default: 'draft',
      index: true,
    },
    finalizedAt: { type: Date },
    amendedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'visit_notes',
  }
);

visitNoteSchema.index({ patientId: 1, createdAt: -1 });
visitNoteSchema.index({ doctorId: 1, createdAt: -1 });

visitNoteSchema.plugin(softDeletePlugin);

export const VisitNote: VisitNoteModel =
  (mongoose.models.VisitNote as VisitNoteModel) ||
  model<IVisitNote, VisitNoteModel>('VisitNote', visitNoteSchema);
