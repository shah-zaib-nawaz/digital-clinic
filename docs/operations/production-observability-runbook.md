# Production Observability, Alerting & Incident Response Runbook

## 1. Overview & System Telemetry Architecture
The Digital Clinic & Healthcare Appointment System runs a multi-layered observability stack:
- **Application Performance Monitoring (APM)**: Sentry v11 with OpenTelemetry Distributed Tracing across Next.js 16.4 App Router and Server Actions.
- **Database Telemetry**: MongoDB 7.7 Atlas connection pool metrics, slow query profiling (`threshold > 100ms`), and TTL index background scanner.
- **AI Gateway & Cost Observability**: Per-session token tracking and daily spend circuit breaker (`checkClinicAIBudgetAndRateLimit`).
- **Media Ingestion**: Cloudinary signed preset delivery logs and Webhook signature verification.

---

## 2. Sentry v11 Alerting Matrix & Severity Tiers

| Severity | Threshold Trigger | Alert Channel | Incident Response SLA |
| :--- | :--- | :--- | :---: |
| **P1 - Critical** | Unhandled 500s > 2% over 5m, DB connection pool starvation, or WebRTC signaling failure | PagerDuty, SMS to on-call Lead SRE | **< 15 minutes** |
| **P2 - High** | AI spend cap tripped (> \$50/day), Resend delivery drop < 95%, or slot lock race spikes | Slack `#clinic-alerts`, Email | **< 1 hour** |
| **P3 - Warning** | P95 latency > 1500ms on `/doctors` directory, or client-side form validation spikes | Slack `#clinic-ops-telemetry` | **< 24 hours** |

---

## 3. MongoDB 7.7.0 Replica-Set Index Maintenance Guide

### Critical Partial & TTL Indexes
```javascript
// 1. Partial Unique Slot Concurrency Guard
db.appointments.createIndex(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["held", "pending", "confirmed"] } }
  }
);

// 2. 5-Minute TTL Index for Abandoned Slot Holds
db.appointments.createIndex(
  { heldUntil: 1 },
  { expireAfterSeconds: 0 }
);

// 3. Doctor Daily Queue Query Acceleration
db.appointments.createIndex(
  { doctorId: 1, date: 1, status: 1 },
  { background: true }
);
```

### Monthly Maintenance Checklist:
1. Run `db.appointments.reIndex()` during scheduled maintenance windows if fragmentation exceeds 20%.
2. Verify TTL scanner thread liveness: `db.serverStatus().metrics.ttl.passes`.
3. Inspect slow queries: `db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 })`.

---

## 4. Cloudinary Signed Upload Preset Rotation Playbook

1. **Schedule**: Rotate API Secret and Signed Upload Presets every 90 days.
2. **Zero-Downtime Rotation**:
   - Step A: Generate secondary API Key/Secret in Cloudinary Console.
   - Step B: Deploy updated `.env.production` with secondary credentials.
   - Step C: Verify patient document uploads at `/patient/book`.
   - Step D: Revoke primary credentials after 48-hour drain period.

---

## 5. Incident Response Playbooks

### Playbook A: Slot Concurrency Storm (Code 11000 Flood)
- **Symptom**: Spikes in `SLOT_TAKEN` errors under peak booking campaigns.
- **Action**:
  1. Inspect whether patients are competing for a single popular physician.
  2. Confirm Next.js Cache Components are revalidating `doctor-slots-${id}` upon hold creation.
  3. Ensure client wizard handles 11000 gracefully with toast notification to re-select slot.

### Playbook B: AI Token Budget Circuit Breaker Trip
- **Symptom**: Alert triggered `BUDGET_EXCEEDED` for daily AI assistant.
- **Action**:
  1. Verify the AI circuit breaker automatically redirected traffic to `/patient/book`.
  2. Inspect `/admin/ai-telemetry` to identify abnormal session lengths or prompt loops.
  3. If legitimate high outpatient demand, increase `AI_DAILY_SPEND_CAP_USD` via environment variables.

### Playbook C: Transactional Email Delivery Drop
- **Symptom**: Resend API returns 429 or bounce rate > 5%.
- **Action**:
  1. Feature flag Twilio SMS fallback (`ENABLE_TWILIO_SMS="true"`).
  2. Verify patient notifications continue streaming in real-time via the SSE bus (`/api/notifications/stream`).
  3. Check SPF/DKIM/DMARC DNS records for `digitalclinic.org`.
