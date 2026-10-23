# Stakeholder Personas, Journeys & Clinical RBAC Matrix

## 1. Executive Summary & Clinical Context
The Digital Clinic & Appointment System provides an enterprise-grade outpatient consultation workflow connecting patients, clinical providers, healthcare administrators, and platform operations. Built upon Next.js 16.4.2, MongoDB 7.7.0, Mongoose 9.11.3, and Vercel AI SDK v7, this architecture satisfies strict healthcare data separation, concurrency-safe booking guarantees, and frictionless clinical administration.

---

## 2. Core Stakeholder Personas

### Persona 1: Patient (`patient`)
* **Demographics**: Sarah Jenkins, 42, Working Parent with chronic migraine & family health duties.
* **Clinical Goals**:
  - Quickly find specialized physicians by department, insurance acceptance, and clinical ratings.
  - Reserve appointments without phone tag or double-booking uncertainty.
  - Safely upload prior medical history (PDFs, MRI scans, lab results) via Cloudinary direct signed uploads.
  - Interact with an empathetic AI Clinical Receptionist for conversational slot discovery and triage.
* **Pain Points**:
  - Losing a slot mid-checkout due to race conditions with other patients.
  - Lack of visibility into queue wait times and appointment confirmation status.
  - Cumbersome authentication flows on mobile devices.

### Persona 2: Doctor / Healthcare Provider (`doctor`)
* **Demographics**: Dr. Marcus Vance, MD, Board-Certified Neurologist.
* **Clinical Goals**:
  - Access an uninterrupted daily schedule queue with live patient arrival status.
  - Author and seal Visit Notes (SOAP notes: Subjective, Objective, Assessment, Plan) immediately post-consultation.
  - Define granular recurring availability patterns and temporary blackout windows without administrative bottlenecks.
* **Pain Points**:
  - Overbooking and ghost bookings (no-shows).
  - High friction in electronic health records UI when charting notes between patient visits.
  - Security concerns regarding unauthorized staff viewing confidential physician diagnostic notes.

### Persona 3: Clinic Administrator (`admin`)
* **Demographics**: Elena Rostova, Practice Manager overseeing 18 physicians across 4 departments.
* **Clinical Goals**:
  - Rebalance provider schedules during emergency sick leaves via atomic multi-appointment reschedule transactions.
  - Monitor daily clinic throughput, no-show rates, and departmental utilization in real time.
  - Triage patient disputes, manual check-ins, and override appointment states with full audit logging.
* **Pain Points**:
  - Phantom writes and split-brain slot conflicts during bulk rescheduling.
  - Difficulty managing provider coverage across cross-functional departments.

### Persona 4: Platform Superadmin (`superadmin`)
* **Demographics**: Alex Chen, Lead DevOps & Security Engineer.
* **Clinical Goals**:
  - Maintain zero-downtime MongoDB replica set operations, TTL index hygiene, and CSFLE compliance.
  - Oversee Better Auth access controls, session revocation, and security audit log streams.
  - Inspect AI SDK v7 runtime token budgets, HMAC verification failures, and MCP server health.
* **Pain Points**:
  - Unaudited privilege escalation.
  - Stale slot leaks exhausting database memory.

---

## 3. Strict Role-Based Access Control (RBAC) Matrix

| Resource & Operation | `patient` | `doctor` | `admin` | `superadmin` | Security Constraint |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Browse Doctor Directory & Reviews** | ✅ Read | ✅ Read | ✅ Read | ✅ Read | Cached via Next.js 16.4 `"use cache"` |
| **Create 5-min Held Slot (`POST /api/appointments/hold`)** | ✅ Own | ❌ | ✅ Any | ✅ Any | Atomic compound unique index check |
| **Confirm Held Appointment (`POST /api/appointments/confirm`)** | ✅ Own | ❌ | ✅ Any | ✅ Any | Requires valid session + held state |
| **Cancel Appointment** | ✅ Own (>24h) | ✅ Assigned | ✅ Any | ✅ Any | Releases slot; triggers audit event |
| **Atomic Reschedule (`POST /api/appointments/reschedule`)** | ❌ | ❌ | ✅ Any | ✅ Any | Enforces `connection.withTransaction()` |
| **View Daily Provider Queue** | ❌ | ✅ Own Queue | ✅ All | ✅ All | Filtered by `doctorId` and current date |
| **Author / Sign Visit Note (SOAP)** | ❌ | ✅ Assigned | ❌ | ❌ | Immutable once status changed to `signed` |
| **Read Visit Note** | ✅ Own Note | ✅ Assigned | ✅ Read-only | ✅ Read-only | Encrypted payload; HIPAA/GDPR audit log |
| **Manage Provider Availability** | ❌ | ✅ Own Slots | ✅ All | ✅ All | Mutates `AvailabilitySlot` collection |
| **AI Receptionist Slot Search & Hold** | ✅ Own Session | ❌ | ❌ | ❌ | HMAC human-in-the-loop confirmation |
| **Direct Cloudinary Document Upload** | ✅ Own (Docs) | ✅ Own (Avatar) | ✅ Any | ✅ Any | Signed upload preset with strict mime types |
| **User & Role Management** | ❌ | ❌ | ❌ | ✅ Full CRUD | Better Auth `createAccessControl` guard |

---

## 4. Architectural Mermaid Sequence Diagrams

### (a) Patient 5-Step Booking with 5-Minute MongoDB TTL Hold

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Sarah (Patient)
    participant Client as Next.js 16.4 Client (Wizard)
    participant Server as Server Action / Route Handler
    participant Mongo as MongoDB 7.7.0 (Replica Set)
    participant Notification as Resend Email Service

    Note over Patient, Client: Step 1-3: Select Dept, Doctor & Slot
    Patient->>Client: Select Slot (Dr. Vance, 2026-10-25 10:00 AM)
    Client->>Server: holdSlot({ doctorId, date, startTime, patientId })
    
    Server->>Mongo: findOneAndUpdate({ doctorId, date, startTime, status: { $nin: ['held', 'pending', 'confirmed'] } }, { $set: { status: 'held', patientId, heldUntil: ISODate(+5m) } }, { upsert: true, new: true })
    alt Slot Conflict or Already Held
        Mongo-->>Server: DuplicateKeyError (11000) or Null Match
        Server-->>Client: 409 Conflict ("Slot reserved by another patient")
        Client-->>Patient: Display alternatives & auto-refresh slots
    else Slot Successfully Held
        Mongo-->>Server: Return held appointment (_id, heldUntil)
        Server-->>Client: 200 OK { appointmentId, heldUntil, expiresAt }
        Note over Client: 5-minute countdown timer starts in UI
        
        Note over Patient, Client: Step 4: Medical Intake & Upload Docs
        Patient->>Client: Fill Medical Intake & Attach Previous Lab Scan
        Client->>Server: getSignedCloudinaryToken({ folder: 'patients/documents' })
        Server-->>Client: Signed upload signature & timestamp
        Client->>Client: Direct POST to Cloudinary (Asset URL received)

        Note over Patient, Client: Step 5: Final Review & Confirm
        Patient->>Client: Click "Confirm Appointment"
        Client->>Server: confirmAppointment({ appointmentId, intakeData, docUrls })
        
        Server->>Mongo: updateOne({ _id: appointmentId, status: 'held', heldUntil: { $gt: now() } }, { $set: { status: 'confirmed', intakeData, docUrls, heldUntil: null } })
        Mongo-->>Server: ModifiedCount = 1
        Server->>Notification: Send appointment confirmation email & ics invite
        Notification-->>Server: Dispatched
        Server-->>Client: 200 Success { bookingReference, status: 'confirmed' }
        Client-->>Patient: Display Confirmation Screen + Add to Calendar
    end

    Note over Mongo: If user abandons: Background TTL index on { heldUntil: 1 } purges or auto-cancels held record at 5m
```

---

### (b) Doctor Daily Queue & Visit Note Publishing

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Dr. Vance (Doctor)
    participant Dashboard as Doctor Queue UI (React 19.3)
    participant Action as Next.js 16.4 Server Actions
    participant Mongo as MongoDB 7.7.0 Replica Set
    participant PatientRecord as Patient Medical File

    Doctor->>Dashboard: Open "Daily Consultation Queue"
    Dashboard->>Action: getDailyQueue({ doctorId: 'doc_123', date: '2026-10-25' })
    Action->>Mongo: Appointment.find({ doctorId, date, status: { $in: ['confirmed', 'in-progress'] } }).sort({ startTime: 1 }).populate('patientId')
    Mongo-->>Action: Return queue array with patient intakes
    Action-->>Dashboard: Stream queue items into UI

    Doctor->>Dashboard: Select Patient -> Click "Begin Consultation"
    Dashboard->>Action: updateAppointmentStatus({ appointmentId, status: 'in-progress' })
    Action->>Mongo: updateOne({ _id: appointmentId }, { $set: { status: 'in-progress', sessionStartedAt: now() } })
    
    Doctor->>Dashboard: Author SOAP Note (Subjective, Objective, Assessment, Plan)
    Dashboard->>Action: saveDraftVisitNote({ appointmentId, patientId, soapNotes, prescriptions })
    Action->>Mongo: VisitNote.findOneAndUpdate({ appointmentId }, { $set: { ...soapNotes, isDraft: true } }, { upsert: true })

    Doctor->>Dashboard: Click "Sign and Seal Clinical Note"
    Dashboard->>Action: signVisitNote({ appointmentId, noteId, doctorSignatureHash })
    Action->>Mongo: withTransaction():<br/>1. VisitNote.updateOne({ _id: noteId }, { $set: { isDraft: false, signedAt: now(), signatureHash } })<br/>2. Appointment.updateOne({ _id: appointmentId }, { $set: { status: 'completed' } })
    Mongo-->>Action: Transaction Committed
    Action-->>Dashboard: 200 OK (Note Sealed, Appointment Completed)
    Dashboard-->>Doctor: Display sealed checkmark & queue advances to next patient
```

---

### (c) Admin Atomic Replica-Set Reschedule

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Clinic Admin (Elena)
    participant Portal as Admin Schedule Manager
    participant Action as Server Action (rescheduleAppointment)
    participant ClientSession as MongoDB Client Transaction
    participant Mongo as MongoDB 7.7.0 Primary
    participant Comms as Notification Dispatcher

    Admin->>Portal: Trigger Reschedule (Appt #9021 -> New Date/Time)
    Portal->>Action: reschedule({ appointmentId, newDoctorId, newDate, newStartTime })
    
    Action->>ClientSession: startSession() -> session.withTransaction({ maxCommitTimeMS: 5000 })
    
    rect rgb(240, 248, 255)
        Note over ClientSession, Mongo: ACID Transaction Isolation
        ClientSession->>Mongo: 1. Check target slot conflict:<br/>findOne({ doctorId: newDoctorId, date: newDate, startTime: newStartTime, status: { $in: ['held', 'pending', 'confirmed'] } }, { session })
        alt Slot Busy
            Mongo-->>ClientSession: Collision detected
            ClientSession->>ClientSession: abortTransaction()
            Action-->>Portal: 409 Conflict ("Target slot already occupied")
        else Slot Free
            ClientSession->>Mongo: 2. Release/archive original slot state
            ClientSession->>Mongo: 3. Create or update appointment with new slot coordinates & status: 'confirmed'
            ClientSession->>Mongo: 4. Insert AuditLog entry { actor: adminId, reason: 'Provider Emergency' }
            ClientSession->>Mongo: commitTransaction()
            Mongo-->>ClientSession: Committed
        end
    end

    ClientSession-->>Action: Transaction Finished
    Action->>Comms: Dispatched rescheduling notification (Email & SMS) to Patient & Doctor
    Action-->>Portal: 200 OK { newAppointmentDetails }
    Portal-->>Admin: Real-time UI toast ("Appointment successfully rescheduled")
```

---

### (d) AI Receptionist Multi-Turn Slot Lookup and HMAC-Signed Human-In-The-Loop Booking Confirmation

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Sarah (Patient)
    participant Drawer as Floating AI Assistant Drawer
    participant Agent as Vercel AI SDK v7 ToolLoopAgent (gpt-5.4)
    participant Tools as Tool Search & MCP Registry
    participant Security as Crypto HMAC Service
    participant Mongo as MongoDB 7.7.0

    Patient->>Drawer: "I need an urgent headache consultation with Dr. Vance this Thursday morning."
    Drawer->>Agent: streamText({ messages, tools: [searchDoctor, findSlots, holdSlot, requestConfirmation] })
    
    Agent->>Tools: toolCall: searchDoctor({ name: "Dr. Vance", specialty: "Neurology" })
    Tools->>Mongo: Query Doctor collection
    Mongo-->>Tools: Returns Dr. Vance profile (ID: doc_123)
    Tools-->>Agent: Doctor found

    Agent->>Tools: toolCall: findAvailableSlots({ doctorId: "doc_123", dateRange: "2026-10-25" })
    Tools->>Mongo: Query AvailabilitySlot minus active Appointments
    Mongo-->>Tools: Returns [10:00 AM, 11:30 AM]
    Tools-->>Agent: Slots available
    
    Agent->>Security: generateToolApprovalToken({ tool: "holdAndBookSlot", payload: { doctorId: "doc_123", slot: "10:00 AM" } })
    Security-->>Agent: Returns signed HMAC token (`hmac_sig_99a8b...`)

    Agent-->>Drawer: Stream response + Render Interactive HITL Confirmation Card:<br/>"Dr. Vance has an opening on Thursday, Oct 25 at 10:00 AM. Would you like me to hold this slot?"
    
    Note over Patient, Drawer: Human-in-the-Loop Approval Step
    Patient->>Drawer: Clicks "Approve & Hold Slot" (Passes HMAC Signature)
    
    Drawer->>Agent: Send Tool Approval { approvalToken, approved: true }
    Agent->>Security: verifyHMAC(approvalToken, AI_HMAC_SECRET)
    alt Invalid or Expired Token
        Security-->>Agent: Rejected (Forgery / Expired)
        Agent-->>Drawer: "Security check failed. Please select the slot again."
    else Verified Signature
        Security-->>Agent: Validated
        Agent->>Tools: execute: holdSlot({ doctorId: "doc_123", time: "10:00 AM", patientId })
        Tools->>Mongo: Atomic slot hold with 5-min TTL
        Mongo-->>Tools: Slot reserved
        Tools-->>Agent: Hold confirmed
        Agent-->>Drawer: "Slot reserved for 5 minutes! Click here to complete your medical intake."
    end
```
