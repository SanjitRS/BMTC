import { PatientRecord, GameSession, GeofenceEvent, ReminderAck, SafeZone, DeduplicatedAlert, AuthUser } from '../shared/contract';

export const seedUsers: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'usr_admin',
    email: 'admin@gurugale.org',
    name: 'Nischal Bhattacharya (Clinical Admin)',
    role: 'admin',
    passwordHash: 'admin123'
  },
  {
    id: 'usr_doctor',
    email: 'dr.barua@gurugale.org',
    name: 'Dr. Ananya Barua (Neurologist / Healthcare Worker)',
    role: 'healthcare_worker',
    assignedPatientIds: ['pat_001', 'pat_002', 'pat_003', 'pat_004'],
    passwordHash: 'doctor123'
  },
  {
    id: 'usr_caregiver',
    email: 'caregiver.rita@gurugale.org',
    name: 'Rita Gogoi (Primary Caregiver)',
    role: 'caregiver',
    assignedPatientIds: ['pat_001', 'pat_002'],
    passwordHash: 'caregiver123'
  }
];

export const seedPatients: PatientRecord[] = [
  {
    patientId: 'pat_001',
    name: 'Pranab Saikia',
    age: 74,
    gender: 'male',
    diagnosisStage: 'moderate',
    primaryLanguage: 'as', // Assamese
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    version: 2,
    assignedCaregiverId: 'usr_caregiver',
    assignedCaregiverName: 'Rita Gogoi',
    notes: 'Shows mild spatial disorientation in afternoon. Responds very well to Bihu and tea garden memory cues.',
    medications: [
      {
        id: 'med_1',
        name: 'Donepezil',
        dosage: '10mg',
        frequency: 'Once daily at bedtime',
        scheduledTimes: ['21:00'],
        purpose: 'Cognitive enhancement & acetylcholinesterase inhibitor'
      },
      {
        id: 'med_2',
        name: 'Memantine',
        dosage: '10mg',
        frequency: 'Twice daily with meals',
        scheduledTimes: ['08:30', '20:00'],
        purpose: 'NMDA receptor antagonist for moderate Alzheimer’s'
      },
      {
        id: 'med_3',
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Morning',
        scheduledTimes: ['08:00'],
        purpose: 'Hypertension control'
      }
    ],
    emergencyContacts: [
      {
        id: 'ec_1',
        name: 'Deep Saikia',
        relationship: 'Son',
        phone: '+91 98640 12345',
        isPrimary: true
      },
      {
        id: 'ec_2',
        name: 'Rita Gogoi',
        relationship: 'Home Care Nurse',
        phone: '+91 94350 67890',
        isPrimary: false
      }
    ],
    safeZones: [
      {
        id: 'zone_home_1',
        patientId: 'pat_001',
        name: 'Saikia Residence (Beltola, Guwahati)',
        type: 'home',
        centerLat: 26.1368,
        centerLng: 91.7928,
        radiusMeters: 180,
        color: '#10B981'
      },
      {
        id: 'zone_clinic_1',
        patientId: 'pat_001',
        name: 'Dispur Polyclinic & Memory Care',
        type: 'clinic',
        centerLat: 26.1432,
        centerLng: 91.7885,
        radiusMeters: 120,
        color: '#3B82F6'
      },
      {
        id: 'zone_park_1',
        patientId: 'pat_001',
        name: 'Shrimanta Shankardev Kalakshetra Park',
        type: 'park',
        centerLat: 26.1265,
        centerLng: 91.8172,
        radiusMeters: 300,
        color: '#8B5CF6'
      }
    ],
    history: [
      {
        version: 1,
        updatedBy: 'Dr. Ananya Barua',
        updatedByRole: 'healthcare_worker',
        updatedAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
        changesSummary: 'Initial clinical assessment and Donepezil initiation (5mg).',
        previousSnapshot: {
          diagnosisStage: 'early',
          version: 1,
          medications: [
            {
              id: 'med_1',
              name: 'Donepezil',
              dosage: '5mg',
              frequency: 'Once daily at bedtime',
              scheduledTimes: ['21:00'],
              purpose: 'Initial dose'
            }
          ]
        }
      }
    ]
  },
  {
    patientId: 'pat_002',
    name: 'Nirmala Devi Ningombam',
    age: 79,
    gender: 'female',
    diagnosisStage: 'early',
    primaryLanguage: 'mn', // Meitei / Manipuri
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    version: 1,
    assignedCaregiverId: 'usr_caregiver',
    assignedCaregiverName: 'Rita Gogoi',
    notes: 'Early-stage MCI. High cognitive retention on routine sequencing and Loktak cultural imagery.',
    medications: [
      {
        id: 'med_4',
        name: 'Rivastigmine Patch',
        dosage: '4.6mg/24h',
        frequency: 'Daily transdermal patch',
        scheduledTimes: ['09:00'],
        purpose: 'Cholinesterase inhibitor'
      },
      {
        id: 'med_5',
        name: 'Vitamin B12 & Folic Acid',
        dosage: '1500mcg',
        frequency: 'Daily after lunch',
        scheduledTimes: ['13:30'],
        purpose: 'Neuro-protective vitamin supplement'
      }
    ],
    emergencyContacts: [
      {
        id: 'ec_3',
        name: 'Thoiba Ningombam',
        relationship: 'Daughter',
        phone: '+91 97740 54321',
        isPrimary: true
      }
    ],
    safeZones: [
      {
        id: 'zone_home_2',
        patientId: 'pat_002',
        name: 'Residence (Imphal West / Uripok)',
        type: 'home',
        centerLat: 24.8170,
        centerLng: 93.9368,
        radiusMeters: 200,
        color: '#10B981'
      }
    ]
  },
  {
    patientId: 'pat_003',
    name: 'Harish Chandra Bose',
    age: 82,
    gender: 'male',
    diagnosisStage: 'severe',
    primaryLanguage: 'bn', // Bengali
    locationTrackingConsent: true,
    consentRevokedAt: null,
    updatedBy: 'Dr. Ananya Barua',
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    version: 3,
    notes: 'Severe Alzheimer’s disease. Wandering risk flagged. Frequent sundowning episodes.',
    medications: [
      {
        id: 'med_6',
        name: 'Memantine',
        dosage: '20mg',
        frequency: 'Daily',
        scheduledTimes: ['08:00', '20:00'],
        purpose: 'Moderate to severe AD symptom control'
      },
      {
        id: 'med_7',
        name: 'Quetiapine',
        dosage: '12.5mg',
        frequency: 'Nightly',
        scheduledTimes: ['21:30'],
        purpose: 'Sundowning agitation management'
      }
    ],
    emergencyContacts: [
      {
        id: 'ec_4',
        name: 'Anirban Bose',
        relationship: 'Son',
        phone: '+91 98300 99887',
        isPrimary: true
      }
    ],
    safeZones: [
      {
        id: 'zone_home_3',
        patientId: 'pat_003',
        name: 'Bose Residence (Shillong / Laitumkhrah)',
        type: 'home',
        centerLat: 25.5788,
        centerLng: 91.8933,
        radiusMeters: 150,
        color: '#10B981'
      }
    ]
  },
  {
    patientId: 'pat_004',
    name: 'Lakshmi Narayan Sharma',
    age: 71,
    gender: 'male',
    diagnosisStage: 'early',
    primaryLanguage: 'hi', // Hindi
    locationTrackingConsent: false,
    consentRevokedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedBy: 'Nischal Bhattacharya (Admin)',
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    version: 1,
    notes: 'Location consent revoked by family. Only cognitive therapy and reminder logs enabled.',
    medications: [
      {
        id: 'med_8',
        name: 'Galantamine ER',
        dosage: '8mg',
        frequency: 'Morning with breakfast',
        scheduledTimes: ['08:30'],
        purpose: 'Cognitive enhancement'
      }
    ],
    emergencyContacts: [
      {
        id: 'ec_5',
        name: 'Suman Sharma',
        relationship: 'Spouse',
        phone: '+91 98111 22334',
        isPrimary: true
      }
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
    notes: 'Newly onboarded today. Baseline cognitive battery pending. Zero completed game sessions yet.',
    medications: [],
    emergencyContacts: [
      {
        id: 'ec_6',
        name: 'Manish Baruah',
        relationship: 'Son',
        phone: '+91 99540 88776',
        isPrimary: true
      }
    ],
    safeZones: [
      {
        id: 'zone_home_5',
        patientId: 'pat_005',
        name: 'Residence (Jorhat)',
        type: 'home',
        centerLat: 26.7509,
        centerLng: 94.2037,
        radiusMeters: 200,
        color: '#10B981'
      }
    ]
  }
];

// Rich GameSession historical data for patient 001 (Stable / Improving)
export const seedGameSessions: GameSession[] = [
  // Day -6
  {
    id: 'gs_101',
    patientId: 'pat_001',
    gameType: 'memory',
    startedAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 10).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 10 + 180000).toISOString(),
    score: 75,
    accuracy: 78,
    avgResponseTimeMs: 4200,
    errorTypes: ['omission'],
    difficultyLevel: 2,
    moodAfter: 'calm',
    synced: true
  },
  {
    id: 'gs_102',
    patientId: 'pat_001',
    gameType: 'pattern',
    startedAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 16).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 16 + 150000).toISOString(),
    score: 80,
    accuracy: 82,
    avgResponseTimeMs: 3800,
    errorTypes: [],
    difficultyLevel: 2,
    moodAfter: 'very_happy',
    synced: true
  },
  // Day -5
  {
    id: 'gs_103',
    patientId: 'pat_001',
    gameType: 'routine',
    startedAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 10).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 10 + 210000).toISOString(),
    score: 72,
    accuracy: 75,
    avgResponseTimeMs: 4500,
    errorTypes: ['spatial_disorientation'],
    difficultyLevel: 2,
    moodAfter: 'neutral',
    synced: true
  },
  // Day -4
  {
    id: 'gs_104',
    patientId: 'pat_001',
    gameType: 'attention',
    startedAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 11).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 11 + 190000).toISOString(),
    score: 84,
    accuracy: 88,
    avgResponseTimeMs: 3400,
    errorTypes: [],
    difficultyLevel: 3,
    moodAfter: 'calm',
    synced: true
  },
  // Day -3
  {
    id: 'gs_105',
    patientId: 'pat_001',
    gameType: 'memory',
    startedAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 10).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 10 + 170000).toISOString(),
    score: 88,
    accuracy: 90,
    avgResponseTimeMs: 3100,
    errorTypes: [],
    difficultyLevel: 3,
    moodAfter: 'very_happy',
    synced: true
  },
  // Day -2
  {
    id: 'gs_106',
    patientId: 'pat_001',
    gameType: 'pattern',
    startedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 10).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 10 + 160000).toISOString(),
    score: 92,
    accuracy: 94,
    avgResponseTimeMs: 2900,
    errorTypes: [],
    difficultyLevel: 3,
    moodAfter: 'very_happy',
    synced: true
  },
  // Day -1
  {
    id: 'gs_107',
    patientId: 'pat_001',
    gameType: 'routine',
    startedAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 10).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 10 + 180000).toISOString(),
    score: 86,
    accuracy: 89,
    avgResponseTimeMs: 3200,
    errorTypes: ['commission'],
    difficultyLevel: 3,
    moodAfter: 'calm',
    synced: true
  },
  // Today
  {
    id: 'gs_108',
    patientId: 'pat_001',
    gameType: 'attention',
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 2 + 175000).toISOString(),
    score: 90,
    accuracy: 92,
    avgResponseTimeMs: 2850,
    errorTypes: [],
    difficultyLevel: 3,
    moodAfter: 'very_happy',
    synced: true
  },

  // Patient 002 (Nirmala - Early stage, high stable performance)
  {
    id: 'gs_201',
    patientId: 'pat_002',
    gameType: 'memory',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 + 150000).toISOString(),
    score: 94,
    accuracy: 96,
    avgResponseTimeMs: 2400,
    errorTypes: [],
    difficultyLevel: 3,
    moodAfter: 'very_happy',
    synced: true
  },
  {
    id: 'gs_202',
    patientId: 'pat_002',
    gameType: 'routine',
    startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 + 140000).toISOString(),
    score: 96,
    accuracy: 98,
    avgResponseTimeMs: 2200,
    errorTypes: [],
    difficultyLevel: 4,
    moodAfter: 'very_happy',
    synced: true
  },

  // Patient 003 (Harish - Severe stage, declining trajectory with high latency and timeouts)
  {
    id: 'gs_301',
    patientId: 'pat_003',
    gameType: 'memory',
    startedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 5 + 300000).toISOString(),
    score: 55,
    accuracy: 58,
    avgResponseTimeMs: 6800,
    errorTypes: ['omission', 'timeout'],
    difficultyLevel: 2,
    moodAfter: 'confused',
    synced: true
  },
  {
    id: 'gs_302',
    patientId: 'pat_003',
    gameType: 'attention',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 + 320000).toISOString(),
    score: 42,
    accuracy: 45,
    avgResponseTimeMs: 8200,
    errorTypes: ['omission', 'timeout', 'commission'],
    difficultyLevel: 1,
    moodAfter: 'agitated',
    synced: true
  },
  {
    id: 'gs_303',
    patientId: 'pat_003',
    gameType: 'routine',
    startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 + 340000).toISOString(),
    score: 38,
    accuracy: 40,
    avgResponseTimeMs: 9100,
    errorTypes: ['timeout', 'spatial_disorientation'],
    difficultyLevel: 1,
    moodAfter: 'confused',
    synced: true
  }
];

export const seedGeofenceEvents: GeofenceEvent[] = [
  {
    id: 'geo_101',
    patientId: 'pat_001',
    zoneId: 'zone_home_1',
    eventType: 'exit',
    lat: 26.1388,
    lng: 91.7949,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    synced: true
  },
  {
    id: 'geo_102',
    patientId: 'pat_001',
    zoneId: 'zone_home_1',
    eventType: 'enter',
    lat: 26.1370,
    lng: 91.7930,
    timestamp: new Date(Date.now() - 3600000 * 3 + 120000).toISOString(),
    synced: true
  },
  {
    id: 'geo_103',
    patientId: 'pat_001',
    zoneId: 'zone_home_1',
    eventType: 'exit',
    lat: 26.1390,
    lng: 91.7952,
    timestamp: new Date(Date.now() - 3600000 * 3 + 240000).toISOString(),
    synced: true
  },
  // Patient 003 critical breach
  {
    id: 'geo_301',
    patientId: 'pat_003',
    zoneId: 'zone_home_3',
    eventType: 'exit',
    lat: 25.5820,
    lng: 91.8980,
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    synced: true
  }
];

export const seedReminderAcks: ReminderAck[] = [
  {
    id: 'rem_101',
    patientId: 'pat_001',
    reminderType: 'medicine',
    scheduledAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    ackedAt: new Date(Date.now() - 3600000 * 12 + 180000).toISOString(),
    status: 'acknowledged',
    notes: 'Morning Memantine & Amlodipine taken with warm tea',
    synced: true
  },
  {
    id: 'rem_102',
    patientId: 'pat_001',
    reminderType: 'hydration',
    scheduledAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    ackedAt: new Date(Date.now() - 3600000 * 6 + 120000).toISOString(),
    status: 'acknowledged',
    notes: 'Drank 250ml water',
    synced: true
  },
  {
    id: 'rem_103',
    patientId: 'pat_001',
    reminderType: 'activity',
    scheduledAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ackedAt: new Date(Date.now() - 3600000 * 4 + 300000).toISOString(),
    status: 'acknowledged',
    notes: '15 min courtyard garden walk',
    synced: true
  },
  {
    id: 'rem_301',
    patientId: 'pat_003',
    reminderType: 'medicine',
    scheduledAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    ackedAt: null,
    status: 'missed',
    notes: 'Unacknowledged morning Memantine 20mg',
    synced: true
  }
];

export const seedAlerts: DeduplicatedAlert[] = [
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
    lastTriggeredAt: new Date(Date.now() - 3600000 * 3 + 240000).toISOString(),
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
    summary: 'Patient exited Bose Residence safe perimeter 60 minutes ago and has not returned. Continuous outbound vector detected.',
    occurrencesCount: 1,
    firstTriggeredAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastTriggeredAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    status: 'active',
    rawEventIds: ['geo_301'],
    suggestedAction: 'Dispatch immediate caregiver search & trigger emergency contact SMS.'
  },
  {
    id: 'alt_003',
    patientId: 'pat_003',
    patientName: 'Harish Chandra Bose',
    alertType: 'missed_medication',
    severity: 'high',
    title: 'Missed Medication: Memantine 20mg',
    summary: 'Scheduled 08:00 morning dose elapsed 4+ hours without acknowledgment.',
    occurrencesCount: 1,
    firstTriggeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    lastTriggeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'active',
    rawEventIds: ['rem_301'],
    suggestedAction: 'Contact primary caregiver Anirban Bose to confirm administration.'
  },
  {
    id: 'alt_004',
    patientId: 'pat_003',
    patientName: 'Harish Chandra Bose',
    alertType: 'cognitive_decline_warning',
    severity: 'high',
    title: 'Cognitive Decline Trajectory Flagged',
    summary: 'Cognitive session accuracy dropped by 31% and average response latency rose to 9,100ms over the past 5 days.',
    occurrencesCount: 3,
    firstTriggeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastTriggeredAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'active',
    rawEventIds: ['gs_301', 'gs_302', 'gs_303'],
    suggestedAction: 'Schedule clinical review with Dr. Ananya Barua for stage re-evaluation.'
  }
];
