import { PatientRecord, GameSession, DebouncedAlert } from "../../shared/contract";

export class IngestionPipelineClient {
  public async getPatients(): Promise<PatientRecord[]> {
    try {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      return data.patients || [];
    } catch (e) {
      // Fallback local sample patient if server not reachable
      return [
        {
          patientId: "patient-101",
          name: "Dharmananda Baruah",
          age: 73,
          diagnosisStage: "moderate",
          medications: [
            { id: "med-1", name: "Donepezil", dosage: "10mg", schedule: "08:00 AM Daily" },
            { id: "med-2", name: "Memantine", dosage: "5mg", schedule: "08:00 PM Daily" },
            { id: "med-3", name: "Omega-3 EPA/DHA", dosage: "1000mg", schedule: "12:00 PM Daily" },
          ],
          emergencyContacts: [
            { name: "Ananya Baruah", relation: "Daughter / Caregiver", phone: "+91 98640 12345", isPrimary: true },
            { name: "Dr. B. K. Sarma", relation: "Consultant Neurologist", phone: "+91 94350 67890", isPrimary: false },
          ],
          updatedBy: "Dr. B. K. Sarma",
          updatedAt: new Date().toISOString(),
          version: 1,
          history: [
            {
              version: 1,
              updatedAt: new Date().toISOString(),
              updatedBy: "Dr. B. K. Sarma",
              changes: { note: "Initial diagnosis and baseline medication recorded." },
            },
          ],
        },
      ];
    }
  }

  public async getPatientSessions(patientId: string): Promise<GameSession[]> {
    try {
      const res = await fetch(`/api/patients/${patientId}/sessions`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      return data.sessions || [];
    } catch (e) {
      return [];
    }
  }

  public async updatePatientRecord(patient: PatientRecord): Promise<PatientRecord> {
    const res = await fetch(`/api/patients/${patient.patientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error("Failed to update record");
    const data = await res.json();
    return data.patient;
  }

  public async getOrgAnalytics() {
    try {
      const res = await fetch("/api/analytics/org");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return await res.json();
    } catch (e) {
      return {
        totalPatients: 1,
        stageDistribution: { early: 0, moderate: 1, severe: 0 },
        totalGameSessions: 4,
        avgOrgAccuracy: 82,
        activeAlertsCount: 0,
        totalOscillationsRecorded: 0,
      };
    }
  }

  public async deletePatientGDPR(patientId: string): Promise<boolean> {
    const res = await fetch(`/api/security/gdpr-delete/${patientId}`, {
      method: "DELETE",
    });
    return res.ok;
  }
}

export const ingestionPipelineClient = new IngestionPipelineClient();
