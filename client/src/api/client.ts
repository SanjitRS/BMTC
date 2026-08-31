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

// Response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (email: string, password?: string) => {
    const res = await apiClient.post<{ token: string; refreshToken: string; user: AuthUser }>('/auth/login', { email, password });
    return res.data;
  },
  switchRole: async (role: UserRole) => {
    const res = await apiClient.post<{ token: string; refreshToken: string; user: AuthUser }>('/auth/switch-role', { role });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<{ user: AuthUser }>('/auth/me');
    return res.data.user;
  },
  getUsers: async () => {
    const res = await apiClient.get<AuthUser[]>('/auth/users');
    return res.data;
  },

  // Central Ingestion Pipeline (Section 3)
  ingestSyncBatch: async (items: SyncQueueItem[]) => {
    const res = await apiClient.post<{
      success: boolean;
      receivedCount: number;
      ingestedCount: number;
      ingestedIds: string[];
      errors?: any[];
      serverTime: string;
    }>('/sync/batch', { items });
    return res.data;
  },
  getSyncStatus: async () => {
    const res = await apiClient.get('/sync/status');
    return res.data;
  },

  // Patients
  getPatients: async (params?: { stage?: string; search?: string }) => {
    const res = await apiClient.get<PatientRecord[]>('/patients', { params });
    return res.data;
  },
  getPatientById: async (id: string) => {
    const res = await apiClient.get<PatientRecord>(`/patients/${id}`);
    return res.data;
  },
  getPatientScorecard: async (id: string) => {
    const res = await apiClient.get<CognitiveTrendScorecard>(`/patients/${id}/scorecard`);
    return res.data;
  },
  createPatient: async (data: Partial<PatientRecord>) => {
    const res = await apiClient.post<PatientRecord>('/patients', data);
    return res.data;
  },
  updateMedicalRecord: async (id: string, updates: any) => {
    const res = await apiClient.put<{ message: string; patient: PatientRecord; currentVersion: number }>(
      `/patients/${id}/records`,
      updates
    );
    return res.data;
  },
  getAuditHistory: async (id: string) => {
    const res = await apiClient.get<{
      patientId: string;
      patientName: string;
      currentVersion: number;
      updatedAt: string;
      updatedBy: string;
      history: any[];
    }>(`/patients/${id}/history`);
    return res.data;
  },
  setLocationConsent: async (id: string, consent: boolean) => {
    const res = await apiClient.post<{ message: string; patient: PatientRecord }>(
      `/patients/${id}/consent`,
      { consent }
    );
    return res.data;
  },
  purgePatientGdpr: async (id: string, confirmation: string = 'PERMANENT_DELETE') => {
    const res = await apiClient.delete<{ message: string; purgedEntitiesCount: number }>(
      `/patients/${id}/gdpr-delete`,
      { data: { confirmation } }
    );
    return res.data;
  },

  // Geofence & Breadcrumbs
  getSafeZones: async (patientId: string) => {
    const res = await apiClient.get(`/geofence/zones/${patientId}`);
    return res.data;
  },
  updateSafeZones: async (patientId: string, safeZones: any[]) => {
    const res = await apiClient.post(`/geofence/zones/${patientId}`, { safeZones });
    return res.data;
  },
  getGeofenceEvents: async (patientId: string) => {
    const res = await apiClient.get<GeofenceEvent[]>(`/geofence/events/${patientId}`);
    return res.data;
  },
  getBreadcrumbs: async (patientId: string) => {
    const res = await apiClient.get<{
      patientId: string;
      consentGranted: boolean;
      message?: string;
      currentLocation: any;
      safeZones: any[];
      trail: any[];
    }>(`/geofence/breadcrumbs/${patientId}`);
    return res.data;
  },

  // Alerts
  getAlerts: async (params?: { patientId?: string; severity?: string; status?: string }) => {
    const res = await apiClient.get<DeduplicatedAlert[]>('/alerts', { params });
    return res.data;
  },
  acknowledgeAlert: async (id: string) => {
    const res = await apiClient.post<{ message: string; alert: DeduplicatedAlert }>(`/alerts/${id}/acknowledge`);
    return res.data;
  },
  resolveAlert: async (id: string) => {
    const res = await apiClient.post<{ message: string; alert: DeduplicatedAlert }>(`/alerts/${id}/resolve`);
    return res.data;
  },
  dispatchCaregiver: async (id: string, payload: { caregiverName?: string; contactNumber?: string; notes?: string }) => {
    const res = await apiClient.post<{ message: string; alert: DeduplicatedAlert }>(`/alerts/${id}/dispatch`, payload);
    return res.data;
  },

  // Analytics
  getOrgAnalytics: async () => {
    const res = await apiClient.get('/analytics/org');
    return res.data;
  },
  getComplianceReport: async () => {
    const res = await apiClient.get('/analytics/compliance');
    return res.data;
  },

  // Simulator
  generateSyncBatch: async (patientId: string, type: 'game_session' | 'geofence_breach' | 'missed_medication', count: number = 1) => {
    const res = await apiClient.post('/simulator/generate-sync', { patientId, type, count });
    return res.data;
  }
};
