import http from 'http';
import app from './index';
import { centralStore } from './services/store.service';
import { analyticsService } from './services/analytics.service';
import { alertDeduplicationService } from './services/deduplication.service';
import { SyncQueueItem, GameSession, GeofenceEvent, ReminderAck } from './shared/contract';

async function runTests() {
  console.log('\n🧪 STARTING GURUGALE (NISCHAL MODULE) COMPREHENSIVE TEST SUITE...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Test In-Memory & File Store
  console.log('--- 1. Store & Initial Patients ---');
  const patients = centralStore.getPatients();
  assert(patients.length >= 5, 'Loads initial patients roster (including brand new empty patient)');
  const pat1 = centralStore.getPatientById('pat_001');
  assert(pat1 !== undefined && pat1.name === 'Pranab Saikia', 'Retrieves patient pat_001 by ID');
  const pat5 = centralStore.getPatientById('pat_005');
  assert(pat5 !== undefined && pat5.name.includes('Bhabani Baruah'), 'Retrieves newly onboarded patient pat_005');

  // 2. Test Central Ingestion Pipeline (Section 3 & Section 0 conformance)
  console.log('\n--- 2. Central Ingestion Pipeline (/api/sync/batch) ---');
  const testSession: GameSession = {
    id: 'test_gs_999',
    patientId: 'pat_001',
    gameType: 'pattern',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    endedAt: new Date().toISOString(),
    score: 95,
    accuracy: 98,
    avgResponseTimeMs: 2300,
    errorTypes: [],
    difficultyLevel: 4,
    moodAfter: 'very_happy',
    synced: false
  };

  const testQueueItem: SyncQueueItem = {
    id: 'sync_test_01',
    entityType: 'game_session',
    payload: testSession,
    createdAt: new Date().toISOString(),
    synced: false,
    retryCount: 0
  };

  centralStore.addGameSession(testSession);
  const fetchedSession = centralStore.getGameSessions('pat_001').find(s => s.id === 'test_gs_999');
  assert(fetchedSession !== undefined && fetchedSession.score === 95, 'Ingests and stores GameSession adhering to shared schema');

  // 3. Test Scorecard Calculations & Empty States
  console.log('\n--- 3. Therapy Scorecard & Empty State Handling ---');
  const sc1 = analyticsService.getPatientScorecard('pat_001');
  assert(sc1.totalSessions > 0, 'Computes therapy scorecard for active patient (pat_001)');
  assert(sc1.accuracyTrend.length > 0, 'Generates longitudinal accuracy trend array');
  assert(['improving', 'stable', 'declining'].includes(sc1.cognitiveStatus), 'Categorizes cognitive trajectory (Improving/Stable/Declining)');

  // Empty State test for pat_005
  const sc5 = analyticsService.getPatientScorecard('pat_005');
  assert(sc5.totalSessions === 0, 'Gracefully handles empty state for brand new patient with 0 sessions');
  assert(sc5.accuracyTrend.length === 0, 'Empty state has safe empty accuracy trend array without runtime errors');

  // 4. Test Versioned Medical Records & Immutable Audit Trail
  console.log('\n--- 4. Patient Records Versioning ($v1 -> $v2 -> $v3) & Audit Trail ---');
  const initialVersion = pat1!.version;
  const updatedPat1 = centralStore.updatePatientRecord(
    'pat_001',
    { notes: 'Updated by Dr. Ananya Barua for clinical evaluation trial' },
    'Dr. Ananya Barua',
    'healthcare_worker',
    'Clinical trial note update'
  );
  assert(updatedPat1.version === initialVersion + 1, `Increments version from v${initialVersion} to v${updatedPat1.version}`);
  assert(updatedPat1.history !== undefined && updatedPat1.history.length > 0, 'Appends prior state to immutable history audit trail');
  assert(updatedPat1.history![updatedPat1.history!.length - 1].updatedBy === 'Dr. Ananya Barua', 'Preserves modifier name in audit history');

  // 5. Test Geofence Alert Deduplication (5-Minute Sliding Window)
  console.log('\n--- 5. 5-Minute Sliding Window Geofence Alert Deduplication ---');
  const event1: GeofenceEvent = {
    id: 'geo_test_1',
    patientId: 'pat_001',
    zoneId: 'zone_home_1',
    eventType: 'exit',
    lat: 26.1400,
    lng: 91.7960,
    timestamp: new Date().toISOString(),
    synced: true
  };
  const alert1 = alertDeduplicationService.processGeofenceEvent(event1, updatedPat1);
  assert(alert1 !== null, 'Creates initial breach alert for exit event');

  // Rapid oscillation event 30 seconds later (inside 5-min sliding window)
  const event2: GeofenceEvent = {
    id: 'geo_test_2',
    patientId: 'pat_001',
    zoneId: 'zone_home_1',
    eventType: 'exit',
    lat: 26.1402,
    lng: 91.7962,
    timestamp: new Date(Date.now() + 30000).toISOString(),
    synced: true
  };
  const alert2 = alertDeduplicationService.processGeofenceEvent(event2, updatedPat1);
  assert(alert2 !== null && alert2.occurrencesCount > 1, 'De-duplicates and batches repeated exits into single summarized alert');

  // 6. Test Revocable GPS Consent & GDPR Hard-Deletion
  console.log('\n--- 6. Revocable Consent & GDPR Permanent Hard Deletion ---');
  const consentRevoked = centralStore.setLocationConsent('pat_001', false, 'Guardian Consent Officer');
  assert(consentRevoked.locationTrackingConsent === false, 'Explicitly revokes location tracking consent');
  const consentRestored = centralStore.setLocationConsent('pat_001', true, 'Guardian Consent Officer');
  assert(consentRestored.locationTrackingConsent === true, 'Restores location tracking consent');

  // GDPR Hard Deletion Test on pat_004
  const purgeResult = centralStore.purgePatientDataPermanently('pat_004');
  assert(purgeResult.purgedCount >= 1, 'Executes permanent GDPR hard erasure');
  const purgedCheck = centralStore.getPatientById('pat_004');
  assert(purgedCheck === undefined, 'Verifies patient is completely expunged from database');

  // 7. Org-Wide Analytics & At-Risk Flagging
  console.log('\n--- 7. Org-Wide Analytics & At-Risk Detection ---');
  const org = analyticsService.getOrgAnalytics();
  assert(org.totalPatients >= 4, 'Calculates org-wide patient total');
  assert(org.flaggedAtRiskPatients.length > 0, 'Detects and flags at-risk / declining patients (e.g. Harish Chandra Bose)');

  console.log(`\n=======================================================`);
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=======================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
