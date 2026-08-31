# Gurugale Platform — Section 2: Sanjit (Geofencing, GPS & Offline Sync Queue Engine)

A modular, resilient dementia care platform engineered strictly to the **Section 0 Shared Data Contract**.

---

## 🚀 Key Modules & Architecture

### Section 2: SANJIT — Geofencing, GPS & Offline Sync Engine (Core)
- **Geofencing & Safe Zones Core**: Configurable safe zones (*Home 150m, Clinic 100m, Park 300m*) using the Haversine formula with a 5m hysteresis buffer to prevent perimeter jitter.
- **GPS Telemetry & Battery-Conscious Polling**: Adaptive power modes (*High Accuracy 1s, Balanced 3s, Power Saver 8s*) and live walking trajectory simulations (*Safe Stroll, Wandering Breach, Boundary Oscillation*).
- **5-Minute Sliding Window Alert Deduplicator**: Debounces rapid back-and-forth boundary crossings into a single consolidated alert summary, reducing clinician alarm fatigue.
- **Offline Sync Queue Engine (`syncEngine`)**: Central write seam holding telemetry, cognitive scores, and records offline in IndexedDB/LocalStorage. Features exponential backoff retry ($1\text{s}, 2\text{s}, 4\text{s}, 8\text{s}\dots$) upon network reconnection.
- **Conflict Resolution**: Last-Write-Wins (LWW) for telemetry and automated 3-way versioned merges for medical records with audit trail preservation.

---

## 📜 Section 0 Shared Data Contract (`contract.ts`)

```typescript
export type GameType = "memory" | "attention" | "routine" | "pattern";
export type DiagnosisStage = "early" | "moderate" | "severe";
export type ReminderType = "medicine" | "hydration" | "activity" | "appointment";
export type ReminderStatus = "acknowledged" | "snoozed" | "missed";
export type GeofenceEventType = "enter" | "exit";
export type EntityType = "game_session" | "geofence_event" | "reminder_ack" | "patient_record";

export interface GameSession {
  id: string;
  patientId: string;
  gameType: GameType;
  startedAt: string;
  endedAt: string;
  score: number;
  accuracy: number;
  avgResponseTimeMs: number;
  errorTypes: string[];
  difficultyLevel: number;
  moodAfter?: string;
  synced: boolean;
}

export interface GeofenceEvent {
  id: string;
  patientId: string;
  zoneId: string;
  eventType: GeofenceEventType;
  lat: number;
  lng: number;
  timestamp: string;
  synced: boolean;
}

export interface ReminderAck {
  id: string;
  patientId: string;
  reminderType: ReminderType;
  scheduledAt: string;
  ackedAt: string | null;
  status: ReminderStatus;
  synced: boolean;
}

export interface PatientRecord {
  patientId: string;
  name: string;
  age: number;
  diagnosisStage: DiagnosisStage;
  medications: Array<{ id: string; name: string; dosage: string; schedule: string }>;
  emergencyContacts: Array<{ name: string; relation: string; phone: string; isPrimary: boolean }>;
  updatedBy: string;
  updatedAt: string;
  version: number;
  history?: Array<{ version: number; updatedAt: string; updatedBy: string; changes: Record<string, any> }>;
}

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  payload: any;
  createdAt: string;
  synced: boolean;
  retryCount: number;
}
```

---

## 🛠️ Project Structure

```
gurugale-platform/
├── server/                                # Backend Server (Central Ingestion & Shared API)
│   ├── src/
│   │   ├── shared/contract.ts             # Shared Data Contract
│   │   ├── modules/
│   │   │   ├── sanjit/                    # Geofencing, Debouncing, Sync Queue Relay
│   │   │   ├── praveen/                   # Cognitive rules & benchmarks
│   │   │   └── nish/                      # Ingestion pipeline, records, analytics, GDPR
│   │   └── index.ts
│   └── package.json
├── client/                                # React + Vite + Tailwind Platform
│   ├── src/
│   │   ├── shared/contract.ts             # Shared Data Contract
│   │   ├── modules/
│   │   │   ├── sanjit/                    # SECTION 2: SANJIT (Geofence, GPS, Sync Engine)
│   │   │   │   ├── geofenceEngine.ts      # Haversine distance, safe zones & boundary state machine
│   │   │   │   ├── gpsTracker.ts          # Battery-conscious polling & GPS route simulator
│   │   │   │   ├── alertDeduplicator.ts   # 5-min sliding window debounce & alert aggregator
│   │   │   │   ├── syncEngine.ts          # Offline write queue, backoff retry & batch flush
│   │   │   │   ├── conflictResolver.ts    # LWW & versioned 3-way record merge
│   │   │   │   └── SanjitSectionView.tsx  # Interactive Geofence Map & Sync Inspector
│   │   │   ├── praveen/                   # Cognitive Therapy Lab (Writes to Sanjit Sync Queue)
│   │   │   └── nish/                      # Clinical Admin Suite & Ingestion Viewer
│   │   ├── components/Navbar.tsx          # Global navigation & live sync status badge
│   │   ├── locales/i18n.ts                # Multilingual (English, Hindi, Assamese, Meitei, Bengali)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── package.json
```

---

## 🏃 Getting Started

### 1. Install & Build
```bash
# Install & Build Server
cd server
npm install
npm run build

# Install & Build Client
cd ../client
npm install
npm run build
```

### 2. Run Development Mode
```bash
# Start Backend Server (Port 3001)
npm run dev:server

# Start Vite Frontend (Port 5173)
npm run dev:client
```
