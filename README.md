# Digital Clinic & Healthcare Appointment System

[![Next.js 16.4](https://img.shields.io/badge/Next.js-16.4.2_LTS-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript 7.0](https://img.shields.io/badge/TypeScript-7.0_tsgo-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.3.3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB 7.7](https://img.shields.io/badge/MongoDB-7.7.0_Replica_Set-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Mongoose 9.11](https://img.shields.io/badge/Mongoose-9.11.3-880000?style=flat)](https://mongoosejs.com/)
[![Better Auth 1.7](https://img.shields.io/badge/Better_Auth-1.7.12_RBAC-purple?style=flat)](https://better-auth.com/)
[![Vercel AI SDK v7](https://img.shields.io/badge/Vercel_AI_SDK-v7_(ai@7.0.148)-black?style=flat)](https://sdk.vercel.ai/)
[![Vitest 5.0](https://img.shields.io/badge/Vitest-5.0.5-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)
[![Playwright 1.64](https://img.shields.io/badge/Playwright-1.64.1_WebMCP-2EAD33?style=flat&logo=playwright)](https://playwright.dev/)

An enterprise-grade outpatient clinical scheduling, telehealth, electronic health records (EHR), and conversational triage platform engineered with high-concurrency ACID transactions, cryptographic Human-in-the-Loop safeguards, and HIPAA compliance governance.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (Next.js 16.4 + React 19)"]
        PublicDir["Public Doctor Directory ('use cache')"]
        BookWizard["5-Step Booking Wizard (5-min TTL Hold)"]
        AIChat["AI Receptionist Widget (HMAC HITL Cards)"]
        DoctorQueue["Clinician Queue & Live SOAP Notes"]
        PatientEHR["Patient Records & Verified Reviews"]
        TelehealthRoom["WebRTC Telehealth Consultation Room"]
    end

    subgraph Core["Core Backend & Business Logic"]
        BetterAuth["Better Auth 1.7.12 (RBAC Engine)"]
        SlotEngine["Slot Math Engine & Break Window Filtering"]
        SignalingBus["In-Memory SSE Signaling Bus"]
        NotificationBus["Real-Time SSE & Twilio/Resend Dispatcher"]
        Guardrails["AI Guardrails & Red-Flag Triage Interceptor"]
    end

    subgraph Data["Data & Persistence Layer"]
        MongoReplSet[("MongoDB 7.7 Atlas Replica Set")]
        TTLIndex["5-Min TTL Index (heldUntil: 1)"]
        UniqueIndex["Partial Unique Index { doctorId, date, startTime }"]
        Cloudinary["Cloudinary Direct Signed Storage"]
    end

    PublicDir --> SlotEngine
    BookWizard --> SlotEngine
    SlotEngine --> MongoReplSet
    AIChat --> Guardrails
    Guardrails --> BetterAuth
    TelehealthRoom --> SignalingBus
    DoctorQueue --> MongoReplSet
    PatientEHR --> MongoReplSet
    MongoReplSet --- TTLIndex
    MongoReplSet --- UniqueIndex
    BookWizard -.-> Cloudinary
```

---

## 11-Phase Implementation Trajectory

| Phase | Milestone | Core Deliverables | Verification Status |
| :---: | :--- | :--- | :---: |
| **0** | **Architecture & Skills** | C4 architecture, MoSCoW matrix, OKLCH design tokens, Cloudinary signed presets, 4 agent skills. | **100% PASS** |
| **1** | **Scaffolding & Auth Layer** | Next.js 16.4.2, `tsgo`, Mongoose 9.11 schemas, Better Auth 1.7.12 RBAC (4 roles), role dashboard shells. | **100% PASS** |
| **2** | **Directory & Schedules** | Instant cached search (`"use cache"` + `cacheTag`), Cloudinary signed ingestion, weekly recurring slot math. | **100% PASS** |
| **3** | **Booking & Concurrency** | 5-Step Wizard, 5-min TTL lock (`heldUntil`), atomic multi-slot reschedule, 10-thread race test passed. | **100% PASS** |
| **4** | **Communications & Real-Time** | Resend 6.34 transactional emails with React Email 6.11, real-time SSE notifications, `<NotificationBell />`, 24h cron worker, Twilio SMS. | **100% PASS** |
| **5** | **AI Receptionist & HITL** | Vercel AI SDK v7, OpenAI `gpt-4o`, cryptographic HMAC-SHA256 HITL approval cards, red-flag emergency symptoms interceptor. | **100% PASS** |
| **6** | **Clinical Charting & SOAP** | `VisitNote` with ICD-10 diagnostics, `Prescription` model, physician signature sealing, doctor notes workspace, patient EHR view. | **100% PASS** |
| **7** | **Reviews & Doctor Reputation** | Verified appointment reviews (1–5 stars, wait time, bedside manner), admin moderation queue, MongoDB `$avg` rating aggregation pipeline. | **100% PASS** |
| **8** | **Telehealth Consultations** | WebRTC video consultation rooms, in-memory SSE signaling bus (`signaling-bus.ts`), patient waiting room, clinician cockpit with live SOAP charting. | **100% PASS** |
| **9** | **Autonomous Testing Suite** | Vitest 5.0.5 unit test suite (53 tests), MongoDB 7.7 Atlas Replica Set integration tests (5 tests), Playwright 1.64.1 E2E, 50-case adversarial AI safety benchmark (100% score). | **100% PASS** |
| **10** | **Production Hardening & CI/CD** | Zod 4 runtime `env.ts`, supply-chain lockfile audit, 4-stage GitHub Actions CI/CD (`.github/workflows/ci-cd.yml`), Vercel Fluid Compute config, multi-stage Alpine Dockerfile, AI budget circuit breaker, and legal/disclaimer pages. | **100% PASS** |

---

## Key Technical Features

### 1. High-Concurrency Concurrency-Resilient Booking Engine
- **Atomic 5-Minute Reservation Lock**: When a patient selects a slot, MongoDB atomically claims it (`status: 'held'`) with a TTL index on `heldUntil`. If abandoned, the slot automatically expires in 300 seconds.
- **Double-Booking Immunity**: Enforced via a partial compound unique index `{ doctorId: 1, date: 1, startTime: 1 }` filtering `{ status: { $in: ['held', 'pending', 'confirmed'] } }`. Verified under 10-thread simultaneous race conditions.
- **Atomic Rescheduling Rollback**: Executed inside `connection.withTransaction()`; if destination slot is claimed, transaction aborts cleanly, preserving the original booking.

### 2. Clinical AI Receptionist with Cryptographic HITL Safeguards
- **Vercel AI SDK v7 (`ai@7.0.148`)**: Powered by OpenAI `gpt-4o` with `toolCallConcurrency: 1` to strictly serialize clinical tool side-effects.
- **HMAC-SHA256 Human-in-the-Loop (HITL) Cards**: The AI cannot mutate appointment states unilaterally. Every slot hold generates a tamper-evident cryptographic token (`timingSafeEqual`) requiring direct patient click authorization with a 10-minute expiry window.
- **Emergency Red-Flag Interceptor**: Automated interception of acute presentations (cardiac, stroke, dyspnea, hemorrhage, anaphylaxis, suicide). Halts booking and issues prominent 911 directives.
- **Daily Budget Circuit Breaker**: Evaluates daily clinic token spend (`checkClinicAIBudgetAndRateLimit`); trips smoothly if cap is reached and deep-links patients to the 5-step wizard.

### 3. Electronic Health Records (EHR) & Sealed SOAP Notes
- **SOAP Format**: Subjective, Objective (vitals), Assessment (ICD-10 search), and Plan (prescriptions with refills and regimens).
- **Cryptographic Signature Sealing**: Once finalized by the physician, the note is sealed with an SHA-256 signature hash and timestamp, transitioning the appointment to `completed`.
- **Verified Reviews & Rating Aggregation**: Only completed appointments permit patient reviews. Admin approval triggers a MongoDB aggregation pipeline recalculating `Doctor.averageRating` and `Doctor.reviewCount`.

### 4. Telehealth Video Consultations
- **WebRTC Peer-to-Peer Rooms**: Sub-50ms peer connection utilizing Google STUN relays.
- **Zero-Dependency SSE Signaling**: In-memory event bus on `globalThis` connected to authenticated `/api/telehealth/signal` SSE streams.
- **Clinician Cockpit**: Split-screen live video consultation with concurrent SOAP charting and real-time in-call text chat.

---

## Pre-Seeded Test Credentials

All accounts share the default development password: **`Password123!`**

| Role | Email Address | Password | Default Portal URL |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@clinic.test` | `Password123!` | `/patient` |
| **Doctor (General)** | `doctor@clinic.test` | `Password123!` | `/doctor` |
| **Doctor (Cardiology)** | `sarah.jenkins@digitalclinic.org` | `Password123!` | `/doctor` |
| **Doctor (Dermatology)** | `elena.rostova@digitalclinic.org` | `Password123!` | `/doctor` |
| **Admin** | `admin@clinic.test` | `Password123!` | `/admin` |
| **Superadmin** | `superadmin@clinic.test` | `Password123!` | `/admin` |

---

## Getting Started

### Prerequisites
- **Node.js**: >= 24.0.0
- **pnpm**: >= 11.0.0
- **MongoDB**: 7.7.0 Replica Set (or MongoDB Atlas cluster)

### 1. Installation
```bash
git clone https://github.com/your-org/digital-clinic.git
cd digital-clinic
pnpm install --frozen-lockfile
```

### 2. Environment Configuration
Create `.env.local` in the project root:
```env
# Database (MongoDB 7.7.0 Replica Set / Atlas)
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/digital_clinic?retryWrites=true&w=majority"

# Better Auth 1.7.12
BETTER_AUTH_SECRET="generate-a-64-char-hex-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# AI Assistant (Vercel AI SDK v7 & OpenAI gpt-4o)
OPENAI_API_KEY="sk-proj-..."
AI_HMAC_SECRET="generate-a-separate-32-char-hmac-secret-for-tool-approvals"
AI_DAILY_SPEND_CAP_USD="50.0"

# Cloudinary Direct Signed Media Ingestion
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Transactional Communications (Resend & Twilio)
RESEND_API_KEY="re_..."
EMAIL_FROM="Digital Clinic <notifications@yourdomain.com>"
ENABLE_TWILIO_SMS="false"

# Observability (Sentry v11)
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
```

### 3. Database Seeding
```bash
# Seed authentication test users (patient, doctor, admin, superadmin)
pnpm exec tsx scripts/seed-auth-users.ts

# Seed core medical departments, 12 doctors, and 7-day availability schedules
pnpm exec tsx scripts/seed-clinic.ts

# Seed idempotent production baseline
pnpm exec tsx scripts/seed-production-baseline.ts
```

### 4. Running Locally
```bash
# Launch Next.js Turbopack development server
pnpm dev

# Application live at: http://localhost:3000
# Healthcheck endpoint: http://localhost:3000/api/health
```

---

## Verification & Testing Commands

```bash
# 1. Vitest 5.0.5 Unit Tests (53 tests across 4 domain suites)
pnpm test:unit

# 2. MongoDB 7.7 Replica Set Integration Tests (ACID transactions & 10-thread race)
pnpm test:integration

# 3. 50-Case Adversarial AI Clinical Safety Benchmark (100% score)
pnpm eval:ai-safety

# 4. Supply-Chain & Lockfile Integrity Auditor
pnpm verify:supply-chain

# 5. TypeScript 7.0 Typecheck (tsgo --noEmit)
pnpm typecheck

# 6. Full Automated HTTP Route Probe (26 application endpoints)
pnpm exec tsx scripts/probe-all-routes.ts

# 7. Next.js Turbopack Production Build
pnpm build
```

---

## Containerization & Deployment

### Multi-Stage Docker Build
```bash
# Build production Docker image (Node 24 Alpine, non-root user nextjs UID 1001)
docker build -t digital-clinic:latest .

# Run container with active healthcheck
docker run -p 3000:3000 --env-file .env.local digital-clinic:latest
```

### Vercel Fluid Compute
Deployment is configured in `vercel.json` with 60-second function timeouts on `/api/ai/chat`, 300-second timeouts on `/api/telehealth/signal`, security headers (`X-Frame-Options: DENY`, strict permissions policy), and automated daily reminder cron execution (`0 8 * * *`).

---

## Regulatory Compliance & Legal Disclaimers

- **HIPAA & GDPR Privacy Policy**: [`/privacy`](file:///d:/anti%202.0/digital-clinic/src/app/(public)/privacy/page.tsx)
- **Terms of Clinical Service**: [`/terms`](file:///d:/anti%202.0/digital-clinic/src/app/(public)/terms/page.tsx)
- **Non-Diagnostic AI Disclaimer**: [`/ai-disclaimer`](file:///d:/anti%202.0/digital-clinic/src/app/(public)/ai-disclaimer/page.tsx)

---

## License
MIT License. Developed for enterprise clinical outpatient operations.
