import axios from 'axios';
import { 
  PatientRecord, 
  GameSession, 
  GeofenceEvent, 
  ReminderAck, 
  DeduplicatedAlert, 
  CognitiveTrendScorecard,
  SyncQueueItem,
  UserRole,
  AuthUser 
} from '../types/contract';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for Bearer token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('gurugale_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fallback in-memory dataset for standalone Netlify deployment
const fallbackPatients: PatientRecord[] = [
  {
    patientId: 'pat_001',
    name: 'Pranab Saikia',
    age: 74,
    gender: 'male',
    diagnosisStage: 'moderate',
    primaryLanguage: 'as',
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    version: 2,
    assignedCaregiverId: 'usr_caregiver',
    assignedCaregiverName: 'Rita Gogoi',
    notes: 'Shows mild spatial disorientation in afternoon. Responds very well to Bihu memory cues.',
    medications: [
      { id: 'med_1', name: 'Donepezil', dosage: '10mg', frequency: 'Bedtime', scheduledTimes: ['21:00'], purpose: 'Cognitive enhancer' },
      { id: 'med_2', name: 'Memantine', dosage: '10mg', frequency: 'Twice daily', scheduledTimes: ['08:30', '20:00'], purpose: 'NMDA antagonist' }
    ],
    emergencyContacts: [
      { id: 'ec_1', name: 'Deep Saikia', relationship: 'Son', phone: '+91 98640 12345', isPrimary: true }
    ],
    safeZones: [
      { id: 'zone_home_1', patientId: 'pat_001', name: 'Saikia Residence (Beltola, Guwahati)', type: 'home', centerLat: 26.1368, centerLng: 91.7928, radiusMeters: 180, color: '#10B981' },
      { id: 'zone_clinic_1', patientId: 'pat_001', name: 'Dispur Polyclinic', type: 'clinic', centerLat: 26.1432, centerLng: 91.7885, radiusMeters: 120, color: '#3B82F6' }
    ],
    history: [
      {
        version: 1,
        updatedBy: 'Dr. Ananya Barua',
        updatedByRole: 'healthcare_worker',
        updatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        changesSummary: 'Initial clinical assessment and Donepezil initiation (5mg).',
        previousSnapshot: { diagnosisStage: 'early', version: 1 }
      }
    ]
  },
  {
    patientId: 'pat_002',
    name: 'Nirmala Devi Ningombam',
    age: 79,
    gender: 'female',
    diagnosisStage: 'early',
    primaryLanguage: 'mn',
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date().toISOString(),
    version: 1,
    assignedCaregiverId: 'usr_caregiver',
    assignedCaregiverName: 'Rita Gogoi',
    notes: 'Early-stage MCI. High cognitive retention on routine sequencing and Loktak cultural imagery.',
    medications: [
      { id: 'med_4', name: 'Rivastigmine Patch', dosage: '4.6mg/24h', frequency: 'Daily', scheduledTimes: ['09:00'], purpose: 'Cholinesterase inhibitor' }
    ],
    emergencyContacts: [
      { id: 'ec_3', name: 'Thoiba Ningombam', relationship: 'Daughter', phone: '+91 97740 54321', isPrimary: true }
    ],
    safeZones: [
      { id: 'zone_home_2', patientId: 'pat_002', name: 'Residence (Imphal West / Uripok)', type: 'home', centerLat: 24.8170, centerLng: 93.9368, radiusMeters: 200, color: '#10B981' }
    ]
  },
  {
    patientId: 'pat_003',
    name: 'Harish Chandra Bose',
    age: 82,
    gender: 'male',
    diagnosisStage: 'severe',
    primaryLanguage: 'bn',
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date().toISOString(),
    version: 3,
    notes: 'Severe Alzheimer’s disease. Wandering risk flagged. Frequent sundowning episodes.',
    medications: [
      { id: 'med_6', name: 'Memantine', dosage: '20mg', frequency: 'Daily', scheduledTimes: ['08:00', '20:00'], purpose: 'AD symptom control' }
    ],
    emergencyContacts: [
      { id: 'ec_4', name: 'Anirban Bose', relationship: 'Son', phone: '+91 98300 99887', isPrimary: true }
    ],
    safeZones: [
      { id: 'zone_home_3', patientId: 'pat_003', name: 'Bose Residence (Shillong)', type: 'home', centerLat: 25.5788, centerLng: 91.8933, radiusMeters: 150, color: '#10B981' }
    ]
  },
  {
    patientId: 'pat_004',
    name: 'Lakshmi Narayan Sharma',
    age: 71,
    gender: 'male',
    diagnosisStage: 'early',
    primaryLanguage: 'hi',
    locationTrackingConsent: false,
    consentRevokedAt: new Date().toISOString(),
    updatedBy: 'Nischal (Admin)',
    updatedAt: new Date().toISOString(),
    version: 1,
    notes: 'Location consent revoked by family.',
    medications: [],
    emergencyContacts: [
      { id: 'ec_5', name: 'Suman Sharma', relationship: 'Spouse', phone: '+91 98111 22334', isPrimary: true }
    ],
    safeZones: []
  },
  {
    patientId: 'pat_005',
    name: 'Bhabani Baruah (New Patient)',
    age: 68,
    gender: 'female',
    diagnosisStage: 'early',
    primaryLanguage: 'as',
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date().toISOString(),
    version: 1,
    notes: 'Newly registered today. 0 completed game sessions.',
    medications: [],
    emergencyContacts: [
      { id: 'ec_6', name: 'Manish Baruah', relationship: 'Son', phone: '+91 99540 88776', isPrimary: true }
    ],
    safeZones: [
      { id: 'zone_home_5', patientId: 'pat_005', name: 'Residence (Jorhat)', type: 'home', centerLat: 26.7509, centerLng: 94.2037, radiusMeters: 200, color: '#10B981' }
    ]
  }
];

let localPatients = [...fallbackPatients];
let localAlerts: DeduplicatedAlert[] = [
  {
    id: 'alt_001',
    patientId: 'pat_001',
    patientName: 'Pranab Saikia',
    alertType: 'geofence_breach',
    severity: 'medium',
    title: 'Boundary Oscillation Detected (Home Zone)',
    summary: 'Patient crossed Saikia Residence perimeter 3 times within a 4-minute window. Movement currently stabilizing near outer gate.',
    occurrencesCount: 3,
    firstTriggeredAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastTriggeredAt: new Date().toISOString(),
    status: 'active',
    rawEventIds: ['geo_101', 'geo_102', 'geo_103'],
    suggestedAction: 'Notify home nurse Rita Gogoi to check front garden perimeter.'
  },
  {
    id: 'alt_002',
    patientId: 'pat_003',
    patientName: 'Harish Chandra Bose',
    alertType: 'geofence_breach',
    severity: 'critical',
    title: 'Active Geofence Breach: 420m Outside Safe Zone',
    summary: 'Patient exited Bose Residence safe perimeter 60 minutes ago and has not returned.',
    occurrencesCount: 1,
    firstTriggeredAt: new Date(Date.now() - 3600000).toISOString(),
    lastTriggeredAt: new Date().toISOString(),
    status: 'active',
    rawEventIds: ['geo_301'],
    suggestedAction: 'Dispatch immediate caregiver search & trigger emergency contact SMS.'
  },
  {
    id: 'alt_003',
    patientId: 'pat_003',
    patientName: 'Harish Chandra Bose',
    alertType: 'cognitive_decline_warning',
    severity: 'high',
    title: 'Cognitive Decline Trajectory Flagged',
    summary: 'Cognitive session accuracy dropped by 31% and average response latency rose to 9,100ms over recent sessions.',
    occurrencesCount: 3,
    firstTriggeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastTriggeredAt: new Date().toISOString(),
    status: 'active',
    rawEventIds: ['gs_301'],
    suggestedAction: 'Schedule clinical review with Dr. Ananya Barua for stage re-evaluation.'
  }
];

export const api = {
  // Auth
  login: async (email: string, password?: string) => {
    try {
      const res = await apiClient.post<{ token: string; refreshToken: string; user: AuthUser }>('/auth/login', { email, password });
      return res.data;
    } catch {
      return {
        token: 'mock_jwt_token',
        refreshToken: 'mock_refresh',
        user: { id: 'usr_admin', email, name: 'Nischal (Clinical Admin)', role: 'admin' as UserRole }
      };
    }
  },
  switchRole: async (role: UserRole) => {
    try {
      const res = await apiClient.post<{ token: string; refreshToken: string; user: AuthUser }>('/auth/switch-role', { role });
      return res.data;
    } catch {
      return {
        token: 'mock_jwt_token',
        refreshToken: 'mock_refresh',
        user: { id: 'usr_demo', email: `${role}@gurugale.org`, name: role === 'admin' ? 'Nischal (Admin)' : role === 'healthcare_worker' ? 'Dr. Ananya Barua (Doctor)' : 'Rita Gogoi (Caregiver)', role }
      };
    }
  },
  getMe: async () => {
    try {
      const res = await apiClient.get<{ user: AuthUser }>('/auth/me');
      return res.data.user;
    } catch {
      return { id: 'usr_admin', email: 'admin@gurugale.org', name: 'Nischal (Clinical Admin)', role: 'admin' as UserRole };
    }
  },
  getUsers: async () => {
    try {
      const res = await apiClient.get<AuthUser[]>('/auth/users');
      return res.data;
    } catch {
      return [
        { id: 'usr_admin', email: 'admin@gurugale.org', name: 'Nischal (Admin)', role: 'admin' as UserRole },
        { id: 'usr_doctor', email: 'doctor@gurugale.org', name: 'Dr. Ananya Barua', role: 'healthcare_worker' as UserRole },
        { id: 'usr_caregiver', email: 'caregiver@gurugale.org', name: 'Rita Gogoi', role: 'caregiver' as UserRole }
      ];
    }
  },

  // Central Ingestion Pipeline (Section 3)
  ingestSyncBatch: async (items: SyncQueueItem[]) => {
    try {
      const res = await apiClient.post('/sync/batch', { items });
      return res.data;
    } catch {
      return { success: true, receivedCount: items.length, ingestedCount: items.length, ingestedIds: items.map(i => i.id), serverTime: new Date().toISOString() };
    }
  },
  getSyncStatus: async () => {
    try {
      const res = await apiClient.get('/sync/status');
      return res.data;
    } catch {
      return { pipelineStatus: 'operational', databaseVersion: '2.0.0', lastSyncTimestamp: new Date().toISOString() };
    }
  },

  // Patients
  getPatients: async (params?: { stage?: string; search?: string }) => {
    try {
      const res = await apiClient.get<PatientRecord[]>('/patients', { params });
      return res.data;
    } catch {
      let filtered = [...localPatients];
      if (params?.stage && params.stage !== 'all') filtered = filtered.filter(p => p.diagnosisStage === params.stage);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.patientId.includes(q));
      }
      return filtered.map(p => ({
        ...p,
        scorecardSummary: {
          cognitiveStatus: (p.patientId === 'pat_001' ? 'improving' : p.patientId === 'pat_003' ? 'declining' : 'stable') as 'improving' | 'stable' | 'declining',
          avgAccuracy: p.patientId === 'pat_005' ? 0 : p.patientId === 'pat_001' ? 88 : p.patientId === 'pat_002' ? 97 : 48,
          totalSessions: p.patientId === 'pat_005' ? 0 : p.patientId === 'pat_001' ? 8 : p.patientId === 'pat_002' ? 2 : 3,
          streakDays: p.patientId === 'pat_005' ? 0 : 7,
          adherenceRate: p.patientId === 'pat_003' ? 50 : 94
        },
        activeAlertsCount: p.patientId === 'pat_001' ? 1 : p.patientId === 'pat_003' ? 2 : 0,
        hasCriticalAlert: p.patientId === 'pat_003'
      }));
    }
  },
  getPatientById: async (id: string) => {
    try {
      const res = await apiClient.get<PatientRecord>(`/patients/${id}`);
      return res.data;
    } catch {
      return localPatients.find(p => p.patientId === id) || localPatients[0];
    }
  },
  getPatientScorecard: async (id: string): Promise<CognitiveTrendScorecard> => {
    try {
      const res = await apiClient.get<CognitiveTrendScorecard>(`/patients/${id}/scorecard`);
      return res.data;
    } catch {
      const pat = localPatients.find(p => p.patientId === id) || localPatients[0];
      if (id === 'pat_005') {
        // Empty State
        return {
          patientId: id,
          patientName: pat.name,
          diagnosisStage: 'early',
          cognitiveStatus: 'stable',
          totalSessions: 0,
          averageAccuracy: 0,
          averageScore: 0,
          averageResponseTimeMs: 0,
          currentStreakDays: 0,
          accuracyTrend: [],
          errorBreakdown: [],
          gameTypePerformance: [],
          adherenceRatePercent: 100
        };
      }
      return {
        patientId: id,
        patientName: pat.name,
        diagnosisStage: pat.diagnosisStage,
        cognitiveStatus: id === 'pat_001' ? 'improving' : id === 'pat_003' ? 'declining' : 'stable',
        totalSessions: 8,
        averageAccuracy: id === 'pat_001' ? 88 : id === 'pat_003' ? 48 : 96,
        averageScore: id === 'pat_001' ? 85 : id === 'pat_003' ? 45 : 94,
        averageResponseTimeMs: id === 'pat_001' ? 3200 : id === 'pat_003' ? 8100 : 2300,
        currentStreakDays: 7,
        accuracyTrend: [
          { date: 'Aug 25', accuracy: 78, score: 75, responseTimeMs: 4200, gameType: 'memory' },
          { date: 'Aug 26', accuracy: 82, score: 80, responseTimeMs: 3800, gameType: 'pattern' },
          { date: 'Aug 27', accuracy: 75, score: 72, responseTimeMs: 4500, gameType: 'routine' },
          { date: 'Aug 28', accuracy: 88, score: 84, responseTimeMs: 3400, gameType: 'attention' },
          { date: 'Aug 29', accuracy: 90, score: 88, responseTimeMs: 3100, gameType: 'memory' },
          { date: 'Aug 30', accuracy: 94, score: 92, responseTimeMs: 2900, gameType: 'pattern' },
          { date: 'Aug 31', accuracy: 92, score: 90, responseTimeMs: 2850, gameType: 'attention' }
        ],
        errorBreakdown: [
          { type: 'omission', count: 4, percentage: 50 },
          { type: 'spatial_disorientation', count: 2, percentage: 25 },
          { type: 'commission', count: 2, percentage: 25 }
        ],
        gameTypePerformance: [
          { gameType: 'memory', sessions: 3, avgAccuracy: 86, avgScore: 84 },
          { gameType: 'attention', sessions: 2, avgAccuracy: 90, avgScore: 87 },
          { gameType: 'routine', sessions: 2, avgAccuracy: 82, avgScore: 79 },
          { gameType: 'pattern', sessions: 2, avgAccuracy: 93, avgScore: 91 }
        ],
        adherenceRatePercent: id === 'pat_003' ? 50 : 94
      };
    }
  },
  createPatient: async (data: Partial<PatientRecord>) => {
    try {
      const res = await apiClient.post<PatientRecord>('/patients', data);
      return res.data;
    } catch {
      const newP = { ...data, patientId: 'pat_' + Date.now(), version: 1, updatedAt: new Date().toISOString() } as PatientRecord;
      localPatients.push(newP);
      return newP;
    }
  },
  updateMedicalRecord: async (id: string, updates: any) => {
    try {
      const res = await apiClient.put<{ message: string; patient: PatientRecord; currentVersion: number }>(`/patients/${id}/records`, updates);
      return res.data;
    } catch {
      const idx = localPatients.findIndex(p => p.patientId === id);
      if (idx !== -1) {
        const current = localPatients[idx];
        const newVer = (current.version || 1) + 1;
        const historyEntry = {
          version: current.version || 1,
          updatedBy: 'Clinical User',
          updatedByRole: 'healthcare_worker' as any,
          updatedAt: new Date().toISOString(),
          changesSummary: updates.changesSummary || 'Updated records',
          previousSnapshot: JSON.parse(JSON.stringify(current))
        };
        const updated = {
          ...current,
          ...updates,
          version: newVer,
          updatedAt: new Date().toISOString(),
          history: [...(current.history || []), historyEntry]
        };
        localPatients[idx] = updated;
        return { message: 'Version updated', patient: updated, currentVersion: newVer };
      }
      throw new Error('Patient not found');
    }
  },
  getAuditHistory: async (id: string) => {
    try {
      const res = await apiClient.get(`/patients/${id}/history`);
      return res.data;
    } catch {
      const pat = localPatients.find(p => p.patientId === id) || localPatients[0];
      return {
        patientId: id,
        patientName: pat.name,
        currentVersion: pat.version,
        updatedAt: pat.updatedAt,
        updatedBy: pat.updatedBy,
        history: pat.history || []
      };
    }
  },
  setLocationConsent: async (id: string, consent: boolean) => {
    try {
      const res = await apiClient.post(`/patients/${id}/consent`, { consent });
      return res.data;
    } catch {
      const idx = localPatients.findIndex(p => p.patientId === id);
      if (idx !== -1) {
        localPatients[idx].locationTrackingConsent = consent;
        localPatients[idx].consentRevokedAt = consent ? null : new Date().toISOString();
        return { message: consent ? 'Consent granted' : 'Consent revoked', patient: localPatients[idx] };
      }
      throw new Error('Patient not found');
    }
  },
  purgePatientGdpr: async (id: string, confirmation: string = 'PERMANENT_DELETE') => {
    try {
      const res = await apiClient.delete(`/patients/${id}/gdpr-delete`, { data: { confirmation } });
      return res.data;
    } catch {
      localPatients = localPatients.filter(p => p.patientId !== id);
      localAlerts = localAlerts.filter(a => a.patientId !== id);
      return { message: 'Patient permanently purged under GDPR', purgedEntitiesCount: 12 };
    }
  },

  // Geofence & Breadcrumbs
  getSafeZones: async (patientId: string) => {
    try {
      const res = await apiClient.get(`/geofence/zones/${patientId}`);
      return res.data;
    } catch {
      const pat = localPatients.find(p => p.patientId === patientId);
      return pat?.safeZones || [];
    }
  },
  updateSafeZones: async (patientId: string, safeZones: any[]) => {
    try {
      const res = await apiClient.post(`/geofence/zones/${patientId}`, { safeZones });
      return res.data;
    } catch {
      const idx = localPatients.findIndex(p => p.patientId === patientId);
      if (idx !== -1) localPatients[idx].safeZones = safeZones;
      return safeZones;
    }
  },
  getGeofenceEvents: async (patientId: string) => {
    try {
      const res = await apiClient.get<GeofenceEvent[]>(`/geofence/events/${patientId}`);
      return res.data;
    } catch {
      return [
        { id: 'geo_103', patientId, zoneId: 'zone_home_1', eventType: 'exit' as const, lat: 26.1390, lng: 91.7952, timestamp: new Date(Date.now() - 3600000 * 3 + 240000).toISOString(), synced: true },
        { id: 'geo_102', patientId, zoneId: 'zone_home_1', eventType: 'enter' as const, lat: 26.1370, lng: 91.7930, timestamp: new Date(Date.now() - 3600000 * 3 + 120000).toISOString(), synced: true },
        { id: 'geo_101', patientId, zoneId: 'zone_home_1', eventType: 'exit' as const, lat: 26.1388, lng: 91.7949, timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), synced: true }
      ];
    }
  },
  getBreadcrumbs: async (patientId: string) => {
    try {
      const res = await apiClient.get(`/geofence/breadcrumbs/${patientId}`);
      return res.data;
    } catch {
      const pat = localPatients.find(p => p.patientId === patientId);
      if (pat?.locationTrackingConsent === false) {
        return { patientId, consentGranted: false, currentLocation: null, safeZones: [], trail: [] };
      }
      return {
        patientId,
        consentGranted: true,
        currentLocation: { lat: 26.1390, lng: 91.7952 },
        safeZones: pat?.safeZones || [],
        trail: [
          { lat: 26.1368, lng: 91.7928, timestamp: new Date(Date.now() - 7200000).toISOString(), isInside: true },
          { lat: 26.1376, lng: 91.7934, timestamp: new Date(Date.now() - 5400000).toISOString(), isInside: true },
          { lat: 26.1384, lng: 91.7940, timestamp: new Date(Date.now() - 3600000).toISOString(), isInside: true },
          { lat: 26.1390, lng: 91.7952, timestamp: new Date().toISOString(), isInside: false }
        ]
      };
    }
  },

  // Alerts
  getAlerts: async (params?: { patientId?: string; severity?: string; status?: string }) => {
    try {
      const res = await apiClient.get<DeduplicatedAlert[]>('/alerts', { params });
      return res.data;
    } catch {
      let filtered = [...localAlerts];
      if (params?.status && params.status !== 'all') filtered = filtered.filter(a => a.status === params.status);
      if (params?.severity && params.severity !== 'all') filtered = filtered.filter(a => a.severity === params.severity);
      return filtered;
    }
  },
  acknowledgeAlert: async (id: string) => {
    try {
      const res = await apiClient.post(`/alerts/${id}/acknowledge`);
      return res.data;
    } catch {
      const a = localAlerts.find(al => al.id === id);
      if (a) {
        a.status = 'acknowledged';
        a.acknowledgedBy = 'Clinical Admin';
        a.acknowledgedAt = new Date().toISOString();
        return { message: 'Alert acknowledged', alert: a };
      }
      throw new Error('Alert not found');
    }
  },
  resolveAlert: async (id: string) => {
    try {
      const res = await apiClient.post(`/alerts/${id}/resolve`);
      return res.data;
    } catch {
      const a = localAlerts.find(al => al.id === id);
      if (a) {
        a.status = 'resolved';
        return { message: 'Alert resolved', alert: a };
      }
      throw new Error('Alert not found');
    }
  },
  dispatchCaregiver: async (id: string, payload: { caregiverName?: string; contactNumber?: string; notes?: string }) => {
    try {
      const res = await apiClient.post(`/alerts/${id}/dispatch`, payload);
      return res.data;
    } catch {
      const a = localAlerts.find(al => al.id === id);
      if (a) {
        a.summary += ` | [DISPATCHED] ${payload.caregiverName || 'Rita Gogoi'} dispatched at ${new Date().toLocaleTimeString()}`;
        a.status = 'acknowledged';
        a.acknowledgedBy = 'Clinical Admin';
        return { message: 'Caregiver dispatched', alert: a };
      }
      throw new Error('Alert not found');
    }
  },

  // Analytics
  getOrgAnalytics: async () => {
    try {
      const res = await apiClient.get('/analytics/org');
      return res.data;
    } catch {
      return {
        totalPatients: localPatients.length,
        activeAlertsCount: localAlerts.filter(a => a.status === 'active').length,
        criticalAlertsCount: localAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
        totalCognitiveSessions: 14,
        orgAverageAccuracy: 82,
        cognitiveDistribution: { improving: 2, stable: 2, declining: 1 },
        flaggedAtRiskPatients: [
          {
            patientId: 'pat_003',
            name: 'Harish Chandra Bose',
            diagnosisStage: 'severe',
            cognitiveStatus: 'declining',
            adherenceRatePercent: 50,
            averageAccuracy: 48,
            reason: 'Cognitive score dropped by >15% and active critical boundary breach'
          }
        ],
        diagnosisStageDistribution: {
          early: localPatients.filter(p => p.diagnosisStage === 'early').length,
          moderate: localPatients.filter(p => p.diagnosisStage === 'moderate').length,
          severe: localPatients.filter(p => p.diagnosisStage === 'severe').length
        }
      };
    }
  },
  getComplianceReport: async () => {
    try {
      const res = await apiClient.get('/analytics/compliance');
      return res.data;
    } catch {
      return { reportDate: new Date().toISOString(), generatedBy: 'Clinical Admin', patientRecords: localPatients };
    }
  },

  // Simulator
  generateSyncBatch: async (patientId: string, type: 'game_session' | 'geofence_breach' | 'missed_medication', count: number = 1) => {
    try {
      const res = await apiClient.post('/simulator/generate-sync', { patientId, type, count });
      return res.data;
    } catch {
      const pat = localPatients.find(p => p.patientId === patientId) || localPatients[0];
      if (type === 'geofence_breach') {
        const newAlt: DeduplicatedAlert = {
          id: 'alt_' + Date.now(),
          patientId: pat.patientId,
          patientName: pat.name,
          alertType: 'geofence_breach',
          severity: 'high',
          title: `Simulated Geofence Breach: ${pat.name}`,
          summary: `Patient simulated exit outside safe zone perimeter at ${new Date().toLocaleTimeString()}.`,
          occurrencesCount: 1,
          firstTriggeredAt: new Date().toISOString(),
          lastTriggeredAt: new Date().toISOString(),
          status: 'active',
          rawEventIds: ['sim_geo_' + Date.now()],
          suggestedAction: 'Notify primary caregiver.'
        };
        localAlerts.unshift(newAlt);
      }
      return { message: `Simulated ${count} items for ${pat.name}`, success: true };
    }
  }
};
