import mongoose, { Schema, model, Types, Model } from 'mongoose';
import { softDeletePlugin } from './plugins/softDeletePlugin';
import './Patient';
import './Doctor';
import './Appointment';
import './VisitNote';

export interface IMedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills: number;
}

export interface IPrescription {
  visitNoteId?: Types.ObjectId | null;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  medications: IMedicationItem[];
  notes?: string;
  issuedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PrescriptionLean = IPrescription & {
  _id: Types.ObjectId;
  id: string;
};

export interface IPrescriptionMethods {
  softDelete(): Promise<IPrescription>;
  restore(): Promise<IPrescription>;
}

export type PrescriptionModel = Model<
  IPrescription,
  {},
  IPrescriptionMethods
>;

const medicationItemSchema = new Schema<IMedicationItem>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
    refills: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const prescriptionSchema = new Schema<
  IPrescription,
  PrescriptionModel,
  IPrescriptionMethods
>(
  {
    visitNoteId: {
      type: Schema.Types.ObjectId,
      ref: 'VisitNote',
      default: null,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
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
    medications: {
      type: [medicationItemSchema],
      required: true,
      validate: {
        validator: (v: IMedicationItem[]) => v.length > 0,
        message: 'A prescription must contain at least one medication item',
      },
    },
    notes: { type: String, trim: true },
    issuedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'prescriptions',
  }
);

prescriptionSchema.index({ patientId: 1, issuedAt: -1 });
prescriptionSchema.index({ doctorId: 1, issuedAt: -1 });

prescriptionSchema.plugin(softDeletePlugin);

export const Prescription: PrescriptionModel =
  (mongoose.models.Prescription as PrescriptionModel) ||
  model<IPrescription, PrescriptionModel>('Prescription', prescriptionSchema);
