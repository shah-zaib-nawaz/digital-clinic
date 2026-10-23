# Multi-Perspective Architecture Specification & C4 Architecture Decision Records (ADR)

## 1. Multi-Perspective Architectural Evaluation & Decision Records

### ADR 001: Monorepo vs Single Modular Next.js 16.4.2 Repository
* **Status**: Accepted & Locked.
* **Context**: The system must support simultaneous development across frontend UI components, backend Mongoose database mutations, Better Auth flows, AI SDK agents, and end-to-end Playwright tests without merge bottlenecks or tooling overhead.
* **Multi-Perspective Analysis**:
  - *Perspective A (Turborepo / Monorepo)*: Offers package separation (`/apps/web`, `/packages/db`, `/packages/ui`), but incurs build orchestration overhead, dual TypeScript compiler discrepancies, and high friction for subagent branch worktrees.
  - *Perspective B (Modular Monolith in Next.js 16.4.2 App Router)*: Colocates domain modules (`src/modules/{appointments, doctors, auth, ai, clinical}`) within a single high-performance compilation context. Leverages Next.js 16.4 native route handlers, Server Actions, and React Server Components.
* **Decision**: Adopt a Single Next.js 16.4.2 Modular Architecture utilizing feature-based directory structures (`src/modules/*`).
* **Consequences**:
  - Unifies dependencies into a single root `pnpm-lock.yaml`.
  - Dramatically accelerates Antigravity multi-agent `/teamwork-preview` execution within isolated Git worktrees.
  - TypeScript 7.0 native Go compiler (`tsgo`) achieves sub-second incremental typecheck passes across the entire codebase.

---

### ADR 002: Hybrid Concurrency Control Architecture
* **Status**: Accepted & Locked.
* **Context**: Clinical appointment scheduling suffers from two distinct concurrency hazards:
  1. *Patient Race Conditions*: Multiple patients attempting to reserve the exact same provider time slot concurrently.
  2. *Admin Schedule Realignment*: Moving existing confirmed appointments or batch rescheduling during emergency provider sick leave.
* **Multi-Perspective Analysis**:
  - *Approach 1 (Pessimistic Distributed Mutex via Redis)*: Introduces an external stateful dependency (Redis / Upstash KV), increasing infrastructure cost and failure modes.
  - *Approach 2 (Full ACID Multi-Document Transactions on Every Write)*: Incurs higher latency and connection pool pressure on initial high-throughput checkout workflows.
  - *Approach 3 (Hybrid Concurrency Model)*:
    - **Tier 1 (Initial Checkout Lock)**: 5-minute MongoDB TTL `status: 'held'` state enforced by a **Partial Unique Compound Index**:
      `{ doctorId: 1, date: 1, startTime: 1 }` where `status: { $in: ['held', 'pending', 'confirmed'] }`.
      Coupled with Mongoose 9.11 `optimisticConcurrency: true` (`__v` version key).
    - **Tier 2 (Admin Rescheduling & Visit Sealing)**: MongoDB 7.7.0 `connection.withTransaction()` with `maxCommitTimeMS: 5000` for multi-document atomic swap operations.
* **Decision**: Implement the Hybrid Concurrency Control Model.
* **Consequences**:
  - Zero double-booking vulnerability at the database engine level without requiring external Redis instances.
  - Automatic reclamation of abandoned holds via MongoDB background TTL index thread (`expireAfterSeconds: 0`).
  - Strict ACID guarantees for administrative reschedules and clinical note seals.

---

## 2. C4 Model Diagrams

### C4 Level 1: System Context Diagram

```mermaid
graph TD
    Patient["👤 Patient<br/>[Web Browser / Mobile]"]
    Doctor["👨‍⚕️ Doctor / Clinical Provider<br/>[Desktop Browser / Tablet]"]
    Admin["👩‍💼 Clinic Administrator<br/>[Desktop Web Browser]"]
    
    System["🏥 Digital Clinic & Appointment System<br/>[Next.js 16.4.2 App Router, Better Auth 1.7, Vercel AI SDK v7]"]

    Mongo[("🗄️ MongoDB Atlas 7.7.0<br/>Replica Set (Primary + Secondary)")]
    Cloudinary["☁️ Cloudinary Media Cloud<br/>Direct Signed Uploads"]
    Resend["📧 Resend Email Gateway<br/>Transactional Notifications"]
    OpenAI["🤖 OpenAI API (gpt-5.4)<br/>AI Reasoning & Tool Loop"]

    Patient -->|"Browses doctors, holds slots, completes intake"| System
    Doctor -->|"Reviews queue, conducts visits, signs SOAP notes"| System
    Admin -->|"Manages schedules, performs atomic reschedules"| System

    System -->|"Read/Write with Transactions & TTL"| Mongo
    System -->|"Generates signed upload tokens"| Cloudinary
    System -->|"Dispatches appointment confirmations"| Resend
    System -->|"Executes multi-turn clinical triage"| OpenAI
    Patient -->|"Directly uploads scans & reports"| Cloudinary

    classDef main fill:#0d9488,stroke:#0f766e,stroke-width:2px,color:#fff;
    classDef actor fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef ext fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff;
    class System main;
    class Patient,Doctor,Admin actor;
    class Mongo,Cloudinary,Resend,OpenAI ext;
```

---

### C4 Level 2: Container Diagram

```mermaid
graph TD
    subgraph BrowserClient ["User Browser / Client Application"]
        SPA["Next.js React 19 Client SPA<br/>[shadcn/ui, Tailwind CSS 4.3.3, SWR / Server Action Hooks]"]
        AIDrawer["Floating AI Assistant Drawer<br/>[Vercel AI SDK useChat + HITL Approval Cards]"]
    end

    subgraph NextServer ["Next.js 16.4.2 LTS Server (Node.js 24)"]
        RSC["React Server Components & Page Layouts<br/>['use cache' + cacheTag() & cacheLife()]"]
        Actions["Server Actions & API Route Handlers<br/>[Zod 4.6.7 z.compile() validation, Better Auth guards]"]
        AIServer["AI Agent Orchestrator<br/>[ToolLoopAgent, OpenAI gpt-5.4, HMAC Verification]"]
        DBLayer["Mongoose 9.11.3 & MongoDB 7.7 Driver<br/>[findAndCount(), withTransaction(), TTL Indexes]"]
    end

    subgraph DataStorage ["Data & External Services"]
        Atlas[("MongoDB Atlas Replica Set<br/>[10 Collections, Partial Unique Indexes, TTL]")]
        CloudinarySvc["Cloudinary Media API"]
        ResendSvc["Resend SMTP / API"]
    end

    SPA -->|"HTTP/2, Server Actions, SSE"| RSC
    SPA -->|"POST Mutations"| Actions
    AIDrawer -->|"Streaming AI Protocol"| AIServer
    RSC -->|"Read Queries"| DBLayer
    Actions -->|"Write Mutations & Transactions"| DBLayer
    AIServer -->|"Tool Execution"| DBLayer
    Actions -->|"Signed Token Minting"| CloudinarySvc
    Actions -->|"Async Notification Dispatch"| ResendSvc
    DBLayer -->|"WiredTiger Engine Protocol"| Atlas

    classDef container fill:#0369a1,stroke:#075985,stroke-width:2px,color:#fff;
    classDef ext fill:#475569,stroke:#334155,stroke-width:2px,color:#fff;
    class SPA,AIDrawer,RSC,Actions,AIServer,DBLayer container;
    class Atlas,CloudinarySvc,ResendSvc ext;
```

---

### C4 Level 3: Component Diagram (Appointments Domain Module)

```mermaid
graph TD
    subgraph ClientLayer ["Client Components"]
        Wizard["BookingWizard.tsx<br/>5-Step Slot Booking Stepper"]
        SlotPicker["SlotGridPicker.tsx<br/>Live Slot Availability Grid"]
        Countdown["HoldCountdownTimer.tsx<br/>5-minute Expiration Indicator"]
    end

    subgraph ActionLayer ["Appointments Module Actions"]
        HoldAction["holdSlotAction.ts<br/>Enforces compound partial index lock"]
        ConfirmAction["confirmAppointmentAction.ts<br/>Validates intake & finalizes hold"]
        RescheduleAction["rescheduleAppointmentAction.ts<br/>Executes withTransaction()"]
        CancelAction["cancelAppointmentAction.ts<br/>Clears slot & dispatches audit log"]
    end

    subgraph ServiceLayer ["Clinical Services & Guardrails"]
        ZodValidator["appointment.schema.ts<br/>Compiled Zod 4.6.7 Validators"]
        AuthGuard["better-auth.guard.ts<br/>Role & Ownership Verification"]
        ConcurrencySvc["concurrency.service.ts<br/>Optimistic Concurrency & TTL Helpers"]
    end

    subgraph ModelLayer ["Mongoose 9.11 Schemas"]
        ApptModel["Appointment.ts<br/>Partial Unique Index + TTL Index"]
        SlotModel["AvailabilitySlot.ts<br/>Compound Weekly Schedule"]
        AuditModel["AuditLog.ts<br/>Administrative Mutation Log"]
    end

    Wizard --> SlotPicker
    Wizard --> Countdown
    SlotPicker --> HoldAction
    Wizard --> ConfirmAction

    HoldAction --> ZodValidator
    HoldAction --> AuthGuard
    HoldAction --> ConcurrencySvc
    ConfirmAction --> ConcurrencySvc

    RescheduleAction --> ConcurrencySvc
    CancelAction --> ConcurrencySvc

    ConcurrencySvc --> ApptModel
    ConcurrencySvc --> SlotModel
    ConcurrencySvc --> AuditModel

    classDef comp fill:#047857,stroke:#065f46,stroke-width:2px,color:#fff;
    classDef model fill:#1e293b,stroke:#0f172a,stroke-width:2px,color:#fff;
    class Wizard,SlotPicker,Countdown,HoldAction,ConfirmAction,RescheduleAction,CancelAction,ZodValidator,AuthGuard,ConcurrencySvc comp;
    class ApptModel,SlotModel,AuditModel model;
```
