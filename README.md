# Gurugale — Dementia Care Platform (Nischal Module)

### Admin Pipeline, Clinical Dashboard, Ingestion Seam & Security

This repository contains the complete implementation for **NISCHAL's module**: the clinical administration dashboard, central ingestion REST pipeline, geofence surveillance map, versioned medical record audit logger, deduplicated alert center, org-wide analytics, multilingual UI, and HIPAA/GDPR security framework.

---

## 0. Shared Data Contract Conformance (Section 0)

All payloads strictly conform to the exact Section 0 shared specification:
- `GameSession`: `{ id, patientId, gameType: "memory"|"attention"|"routine"|"pattern", startedAt, endedAt, score, accuracy, avgResponseTimeMs, errorTypes[], difficultyLevel, moodAfter?, synced }`
- `GeofenceEvent`: `{ id, patientId, zoneId, eventType: "enter"|"exit", lat, lng, timestamp, synced }`
- `ReminderAck`: `{ id, patientId, reminderType: "medicine"|"hydration"|"activity"|"appointment", scheduledAt, ackedAt|null, status?, synced }`
- `PatientRecord`: `{ patientId, name, age, diagnosisStage: "early"|"moderate"|"severe", medications[], emergencyContacts[], updatedBy, updatedAt, version, history? }`
- `SyncQueueItem`: `{ id, entityType: "game_session"|"geofence_event"|"reminder_ack"|"patient_record", payload, createdAt, synced, retryCount }`

---

## 1. Key Features Implemented

1. **Central Ingestion Pipeline (`POST /api/sync/batch`)**:
   - Single source of truth ingesting sync batches from Praveen's cognitive games and Sanjit's geofencing/GPS engine.
   - Atomic validation and database persistence.
2. **Clinical Dashboard & Therapy Scorecards (Recharts)**:
   - Longitudinal Accuracy & Score Progression trend graphs.
   - Average Reaction Latency curves in milliseconds (detecting cognitive slowing).
   - Streak tracking & cognitive trajectory classification: **Improving**, **Stable**, or **Declining**.
   - **Empty States**: Brand new patients (e.g. `pat_005`) render clean, sensible guidance states without broken charts.
3. **Interactive Geofence Map & Live Telemetry**:
   - Safe zone boundary radii (Home, Clinic, Park).
   - Real-time GPS coordinates and breadcrumbs trail.
   - Geofence event log with timestamps and enter/exit badges.
4. **Versioned Patient Records with Immutable Audit Diff Trail**:
   - Diagnostic stage, medication schedules (dosages/times), emergency contacts, and clinical notes editor.
   - Version incrementing on every modification ($v1 \rightarrow v2 \rightarrow v3$).
   - Interactive **Audit Diff Modal** displaying previous snapshots, who made the edit, timestamp, and reasons without silent overwrites.
5. **Deduplicated Alert Center**:
   - 5-minute sliding window filter for geofence boundary oscillations and missed medication/hydration.
   - One-click clinician actions: **Acknowledge**, **Resolve**, and **Dispatch Caregiver**.
6. **Multilingual Dashboard UI**:
   - Language selector supporting **English**, **Hindi**, **Assamese** (`as`), **Meitei/Manipuri** (`mn`), and **Bengali** (`bn`) with automatic English fallback.
7. **Org-Wide Analytics & Automated At-Risk Detection**:
   - Population distribution across Early, Moderate, and Severe stages.
   - Early warning system detecting $>15\%$ accuracy drops, $>30\%$ latency spikes, or $<60\%$ adherence.
8. **Auth, RBAC & GDPR Compliance**:
   - JWT authentication + refresh rotation.
   - Role-Based Access Control (`Admin`, `Healthcare Worker`, `Caregiver`).
   - **Explicit Revocable GPS Consent**: Patients/Guardians can revoke location tracking, immediately pausing GPS ingestion.
   - **Permanent GDPR Hard Deletion**: Full right-to-be-forgotten path with confirmation safety lock (`PERMANENT_DELETE`).
9. **Interactive Sync Ingestion Simulator**:
   - Built-in admin testing tool to simulate incoming batches from Praveen & Sanjit and test live ingestion.

---

## 2. Directory Structure

```
├── shared/
│   ├── contract.ts              # Exact Section 0 Data Contract & Types
│   ├── sanjitSeam.ts            # Sanjit Sync & Geofence Seam (enqueue, flushQueue, getSyncStatus)
│   ├── praveenSeam.ts           # Praveen Cognitive & Difficulty Engine Seam
├── server/                      # Node.js/Express + TypeScript REST Backend
│   ├── src/
│   │   ├── controllers/         # Auth, Sync Ingestion, Patients, Geofence, Alerts, Analytics, Simulator
│   │   ├── services/            # Store (with GDPR hard delete), Deduplication, Analytics
│   │   ├── middlewares/         # JWT Auth & RBAC
│   │   ├── routes/              # Express API Routes
│   │   ├── data/seedData.ts     # Realistic multi-day seed dataset
│   │   └── test-runner.ts       # 20-test Automated Verification Suite
├── client/                      # React + Vite + Tailwind CSS Admin SPA
│   ├── src/
│   │   ├── views/               # Dashboard, PatientDetail (Scorecard), GeofenceMap, Records, Alerts, Analytics, Security, Login
│   │   ├── components/          # Navbar (RBAC & Lang), Sidebar, EmptyState, AuditDiffModal, SimulatorModal
│   │   ├── locales/             # Translations (EN, HI, AS, MN, BN)
│   │   └── context/             # AuthContext (Role Switcher), LanguageContext
```

---

## 3. Quick Start & Execution

### Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Run Server & Client
```bash
# In terminal 1 (Backend on http://localhost:5000)
cd server
npm run dev

# In terminal 2 (Frontend on http://localhost:3000)
cd client
npm run dev
```

### Run Automated Verification Test Suite
```bash
cd server
npm run test
```