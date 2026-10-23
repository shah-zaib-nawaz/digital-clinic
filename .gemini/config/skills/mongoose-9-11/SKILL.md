---
name: mongoose-9-11
description: Production guidelines and patterns for Mongoose 9.11.3 and MongoDB Driver 7.7.0. Enforces native findAndCount, lean type narrowing, optimistic concurrency, transactions, and aggregate abort signals.
triggers:
  - mongoose
  - mongodb
  - findAndCount
  - withTransaction
  - optimisticConcurrency
  - TLeanResultType
---

# Mongoose 9.11.3 & MongoDB Driver 7.7.0 Engineering Standard

## 1. Core Principles
- Always enable `optimisticConcurrency: true` on schemas undergoing concurrent updates to prevent lost updates via the `__v` version key.
- Configure MongoDB 7.7.0 client options with `maxAdaptiveRetries: 2` and unified connection pooling.
- Use native `Query.prototype.findAndCount()` or standard single-pass pagination to avoid redundant dual round-trips.
- Enforce strict typing with `.lean<TLeanResultType>()` on all read-only queries.
- Execute multi-document mutations inside `connection.withTransaction()` with `maxCommitTimeMS: 5000`.
- Always pass an `AbortSignal` to aggregation pipelines via `.aggregate(pipeline, { signal })` to cancel hung queries upon HTTP timeout or client disconnect.

---

## 2. Connection Setup & Driver Configuration

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // MongoDB Driver 7.7 adaptive retries
      // @ts-ignore driver options
      maxAdaptiveRetries: 2,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
```

---

## 3. Schema Definition with Optimistic Concurrency & Partial Indexes

```typescript
import { Schema, model, models, Types } from 'mongoose';
import { IAppointment } from '@/types/clinical';

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['held', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'held',
      required: true,
      index: true,
    },
    heldUntil: { type: Date, default: null },
    chiefComplaint: { type: String, maxlength: 2000 },
    attachmentUrls: [{ type: String }],
    cancellationReason: { type: String },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Mongoose 9.11 __v validation on save()
    versionKey: '__v',
  }
);

// 1. Partial Unique Index: Only 1 active appointment (held/pending/confirmed) per doctor-slot
appointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['held', 'pending', 'confirmed'] },
    },
  }
);

// 2. TTL Index on heldUntil for automatic 5-min release
appointmentSchema.index(
  { heldUntil: 1 },
  { expireAfterSeconds: 0 }
);

export const Appointment = models.Appointment || model<IAppointment>('Appointment', appointmentSchema);
```

---

## 4. Atomic Multi-Document Transactions

```typescript
import mongoose from 'mongoose';
import { Appointment } from '@/models/Appointment';
import { AuditLog } from '@/models/AuditLog';

export async function rescheduleAtomic(params: {
  appointmentId: string;
  newDoctorId: string;
  newDate: Date;
  newStartTime: string;
  newEndTime: string;
  adminUserId: string;
}) {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(
      async () => {
        // Step 1: Check target collision inside transaction
        const collision = await Appointment.findOne({
          doctorId: params.newDoctorId,
          date: params.newDate,
          startTime: params.newStartTime,
          status: { $in: ['held', 'pending', 'confirmed'] },
        }).session(session);

        if (collision) {
          throw new Error('TARGET_SLOT_OCCUPIED');
        }

        // Step 2: Update existing appointment
        const updated = await Appointment.findOneAndUpdate(
          { _id: params.appointmentId },
          {
            $set: {
              doctorId: params.newDoctorId,
              date: params.newDate,
              startTime: params.newStartTime,
              endTime: params.newEndTime,
              status: 'confirmed',
              heldUntil: null,
            },
          },
          { new: true, session }
        );

        if (!updated) {
          throw new Error('APPOINTMENT_NOT_FOUND');
        }

        // Step 3: Insert audit log entry
        await AuditLog.create(
          [
            {
              action: 'RESCHEDULE',
              entityId: updated._id,
              entityType: 'Appointment',
              performedBy: params.adminUserId,
              metadata: {
                previousDoctor: updated.doctorId,
                newDoctor: params.newDoctorId,
                date: params.newDate,
              },
            },
          ],
          { session }
        );

        return updated;
      },
      {
        maxCommitTimeMS: 5000,
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      }
    );

    return { success: true, appointment: result };
  } finally {
    await session.endSession();
  }
}
```

---

## 5. Aggregation with AbortSignal

```typescript
import { Doctor } from '@/models/Doctor';

export async function searchSpecialists(departmentId: string, signal?: AbortSignal) {
  const pipeline = [
    { $match: { departmentId: new Types.ObjectId(departmentId), isAcceptingPatients: true } },
    { $sort: { averageRating: -1, reviewCount: -1 } },
    { $limit: 20 },
  ];

  // AbortSignal terminates expensive execution if the client navigates away
  return await Doctor.aggregate(pipeline, { signal }).exec();
}
```
