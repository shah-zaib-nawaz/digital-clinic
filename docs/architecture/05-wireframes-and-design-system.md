# UI/UX Wireframes & Tailwind CSS 4.3.3 Design System Blueprint

## 1. Design System Overview & Tokens
The Digital Clinic & Appointment System design system is built with **Tailwind CSS 4.3.3** using modern CSS-first `@theme inline` variables, high-chroma **OKLCH** color spaces for perceptual uniformity, and dark mode adaptation via `next-themes`.

Token blueprint file: [`src/styles/theme-blueprint.css`](file:///d:/anti%202.0/digital-clinic/src/styles/theme-blueprint.css)

### Clinical Status Badge Color Tokens (WCAG 2.2 AA Contrast >= 4.5:1)
All status badges satisfy strict AA contrast requirements for both light and dark backgrounds:

| Status Key | Light Mode (Background / Text / Border) | Dark Mode (Background / Text / Border) | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **`held`** | `oklch(0.95 0.04 85)` / `oklch(0.38 0.12 80)` / `oklch(0.85 0.08 85)` | `oklch(0.25 0.06 85)` / `oklch(0.88 0.12 85)` / `oklch(0.35 0.08 85)` | 5-minute checkout hold in progress |
| **`pending`** | `oklch(0.95 0.04 220)` / `oklch(0.35 0.10 220)` / `oklch(0.85 0.08 220)` | `oklch(0.24 0.05 220)` / `oklch(0.85 0.10 220)` / `oklch(0.34 0.08 220)` | Awaiting provider/admin acceptance |
| **`confirmed`** | `oklch(0.94 0.05 160)` / `oklch(0.32 0.12 160)` / `oklch(0.82 0.09 160)` | `oklch(0.24 0.07 160)` / `oklch(0.85 0.12 160)` / `oklch(0.34 0.09 160)` | Slot booked & verified |
| **`completed`** | `oklch(0.93 0.04 200)` / `oklch(0.30 0.11 200)` / `oklch(0.82 0.07 200)` | `oklch(0.23 0.05 200)` / `oklch(0.84 0.10 200)` / `oklch(0.33 0.07 200)` | Consultation finished & note signed |
| **`cancelled`** | `oklch(0.95 0.04 25)` / `oklch(0.40 0.18 25)` / `oklch(0.88 0.08 25)` | `oklch(0.25 0.08 25)` / `oklch(0.88 0.14 25)` / `oklch(0.38 0.10 25)` | Terminated by patient or admin |
| **`no-show`** | `oklch(0.93 0.02 280)` / `oklch(0.35 0.06 280)` / `oklch(0.84 0.03 280)` | `oklch(0.22 0.03 280)` / `oklch(0.82 0.06 280)` / `oklch(0.32 0.04 280)` | Patient failed to attend |

---

## 2. Component Hierarchies & UI Wireframes

### Wireframe 1: Public Doctor Directory & Search

```
+----------------------------------------------------------------------------------------------------+
|  [Logo] DIGITAL CLINIC             [Find Doctors]  [Departments]  [About]         [Sign In / Book] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   Find Your Clinical Specialist                                                                    |
|   +------------------------------------------------------------------+  +----------------------+   |
|   | 🔍 Search by doctor name, specialty, or condition...             |  | Department: [All v]  |   |
|   +------------------------------------------------------------------+  +----------------------+   |
|                                                                                                    |
|   +-------------------------------------+  +-------------------------------------+                 |
|   | [Avatar] Dr. Marcus Vance, MD       |  | [Avatar] Dr. Sarah Lin, MD          |                 |
|   | Neurology • 14 yrs exp              |  | Cardiology • 9 yrs exp              |                 |
|   | ⭐ 4.9 (128 reviews)                |  | ⭐ 4.8 (94 reviews)                 |                 |
|   | Consultation Fee: $150              |  | Consultation Fee: $175              |                 |
|   | Next Available: Today, 3:30 PM      |  | Next Available: Tomorrow, 10:00 AM  |                 |
|   |                                     |  |                                     |                 |
|   | [ View Profile ]  [ Book Slot -> ]  |  | [ View Profile ]  [ Book Slot -> ]  |                 |
|   +-------------------------------------+  +-------------------------------------+                 |
+----------------------------------------------------------------------------------------------------+
```

#### shadcn Component Hierarchy:
- `DoctorDirectoryPage`
  - `HeaderNav` (`NavigationMenu`, `ThemeToggle`, `UserAvatarMenu` via `@better-auth-ui`)
  - `SearchFilterBar` (`Input`, `Select`, `BadgeGroup`)
  - `DoctorGrid` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)
    - `Avatar` + `CldImage`
    - `RatingStar`
    - `Badge` (Department, Accepting Patients)
    - `Button` (Variant: `default`, `outline`)

---

### Wireframe 2: 5-Step Patient Booking Wizard with 5-Minute Hold

```
+----------------------------------------------------------------------------------------------------+
|  Step 1: Department  -->  Step 2: Doctor  -->  [Step 3: Slot]  -->  Step 4: Intake  -->  Step 5: Review |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Select Date & Time for Dr. Marcus Vance                                                           |
|                                                                                                    |
|  [ < October 2026 > ]                      Morning Slots (9:00 AM - 12:00 PM)                      |
|  Su  Mo  Tu  We  Th  Fr  Sa                +----------+  +----------+  +----------+                |
|               1   2   3   4                | 09:00 AM |  | 09:30 AM |  | 10:00 AM | [HELD BY YOU]  |
|   5   6   7   8   9  10  11                +----------+  +----------+  +----------+                |
|  12  13  14  15  16  17  18                Afternoon Slots (1:00 PM - 5:00 PM)                     |
|  19  20  21  22  23 [24] 25                +----------+  +----------+                              |
|  26  27  28  29  30  31                    | 02:00 PM |  | 03:30 PM |                              |
|                                            +----------+  +----------+                              |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | ⏱️ Slot Held for 04:47 minutes. Complete intake within this window to guarantee booking.      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|                                                     [ Back ]   [ Continue to Medical Intake -> ]   |
+----------------------------------------------------------------------------------------------------+
```

#### Component Hierarchy:
- `BookingWizardLayout`
  - `WizardStepper` (`Progress`, `StepperItem`)
  - `ActiveStepContainer`
    - `CalendarSlotPicker` (`Calendar` [react-day-picker], `SlotButtonGrid`)
    - `HoldCountdownBanner` (`Alert`, `Progress`, `LucideTimer`)
    - `IntakeFormStep` (`Form`, `FormField`, `Textarea`, `CloudinaryUploadWidget`)
    - `ReviewConfirmStep` (`Card`, `Separator`, `Button` [loading state])

---

### Wireframe 3: Floating AI Assistant Drawer with HMAC-Signed Tool Approval Card

```
+------------------------------------------------------------+
|  🤖 Clinical AI Assistant                   [ - ]  [ X ]   |
+------------------------------------------------------------+
|  AI: Hello Sarah! I can help you find specialists, triage  |
|      symptoms, or reserve your appointment directly.       |
|                                                            |
|  User: I need to see Dr. Vance on Thursday around 10 AM.   |
|                                                            |
|  AI: I checked Dr. Vance's calendar for Thursday, Oct 24.  |
|      A 10:00 AM slot is currently open.                    |
|                                                            |
|  +------------------------------------------------------+  |
|  | 🛡️ HUMAN-IN-THE-LOOP APPROVAL REQUIRED               |  |
|  | Action: Reserve 5-Minute Slot Hold                   |  |
|  | Provider: Dr. Marcus Vance, MD (Neurology)           |  |
|  | Time: Thursday, Oct 24, 2026 @ 10:00 AM              |  |
|  | Fee: $150.00                                         |  |
|  | HMAC Signature: [Verified Authentic]                |  |
|  |                                                      |  |
|  |   [ Reject / Cancel ]      [ Approve & Reserve Slot ] |  |
|  +------------------------------------------------------+  |
|                                                            |
|  [ Ask a follow-up or provide symptom details...     ] [>] |
+------------------------------------------------------------+
```

#### Component Hierarchy:
- `AiAssistantDrawer` (`Sheet` / `Drawer`, `ScrollArea`)
  - `MessageThread` (`Avatar`, `ChatMessageBubble`, `MarkdownRenderer`)
  - `HitlToolApprovalCard` (`Card`, `Badge` [HMAC Verified], `Button` [Approve/Reject])
  - `ChatInputBar` (`TextareaAutosize`, `Button`, `VoiceDictationToggle`)

---

### Wireframe 4: Doctor Daily Queue & Visit Note Editor

```
+----------------------------------------------------------------------------------------------------+
|  Queue: Thursday, Oct 24 (6 Patients)                     | Active Visit: Sarah Jenkins (10:00 AM) |
+-----------------------------------------------------------+----------------------------------------+
|  [10:00 AM] Sarah Jenkins       • [IN CONSULTATION]       | Subjective (Patient Chief Complaint):  |
|             Migraine Aura                                 | [ Severe throbbing headache with...  ] |
|  [10:45 AM] Robert Davis        • [CONFIRMED]             | Objective (Vital Signs & Exam):        |
|             Post-Op Check                                 | [ BP: 120/80, HR: 72, Normal neuro...] |
|  [11:30 AM] Amanda Chen         • [CONFIRMED]             | Assessment (Diagnosis):                |
|             Annual Physical                               | [ Chronic Migraine with typical aura ] |
|  [01:15 PM] James Wilson        • [CONFIRMED]             | Plan & Prescriptions:                  |
|             Hypertension Review                           | [ Sumatriptan 50mg PRN, hydration...]  |
|  [02:00 PM] Emily Taylor        • [HELD]                  |                                        |
|  [02:45 PM] Michael Scott       • [CONFIRMED]             | [ Save Draft ]   [ 🔏 Sign & Seal Note ]|
+-----------------------------------------------------------+----------------------------------------+
```

#### Component Hierarchy:
- `DoctorConsultationDashboard`
  - `QueueSidebar` (`Table`, `Badge` [Semantic Status], `ScrollArea`)
  - `ActiveConsultationPane`
    - `PatientIntakeSummary` (`Accordion`, `DocumentThumbnailList`)
    - `SoapNoteEditor` (`Form`, `Tabs`, `Textarea`, `PrescriptionItemEditor`)
    - `SealingDialog` (`AlertDialog`, `PasswordConfirmationInput`)

---

### Wireframe 5: Admin Analytics Dashboard

```
+----------------------------------------------------------------------------------------------------+
|  ADMIN MISSION CONTROL                    [Day] [Week] [Month]           [Export Audit Log]        |
+----------------------------------------------------------------------------------------------------+
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+    |
|  | Today's Visits     |  | Active Holds       |  | Provider Coverage  |  | Avg Wait Time      |    |
|  | 48 Patients        |  | 3 In Checkout      |  | 94% (17/18 Active) |  | 8.4 Minutes        |    |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+    |
|                                                                                                    |
|  Hourly Throughput & Appointment Flow                   Departmental Distribution                  |
|  +--------------------------------------------------+  +----------------------------------------+  |
|  | [ Bar Chart: Appointments per Hour (9AM - 5PM) ] |  | [ Donut Chart: Neurology / Cardio... ] |  |
|  +--------------------------------------------------+  +----------------------------------------+  |
|                                                                                                    |
|  Emergency Provider Rebalancing & Reschedule                                                       |
|  +----------------------------------------------------------------------------------------------+  |
|  | Provider: [Dr. Marcus Vance v] -> Action: [Rebalance Schedule v] -> Target: [Dr. Lin v]     |  |
|  | [ Execute Atomic Reschedule Transaction (5 Affected Slots) ]                                 |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Accessibility Standards (WCAG 2.2 AA & ARIA 1.2)
1. **Color Contrast**: All text vs background combinations achieve `>= 4.5:1` normal text, `>= 3:1` large text.
2. **Focus Rings**: Enforced universally via `:focus-visible` with `outline: 2px solid var(--ring)` and `outline-offset: 2px`.
3. **Screen Reader Live Regions**:
   - `aria-live="polite"` applied to the 5-minute hold timer.
   - `aria-live="assertive"` on slot conflict alerts.
4. **Accessible Charts**: Recharts / SVG charts rendered with `role="img"`, descriptive `aria-label`, and high-contrast color palettes with accessible data tables provided in hidden screen-reader disclosure tabs.
