import React, { useState } from "react";
import {
  FileText,
  History,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  Edit3
} from "lucide-react";
import { PatientRecord, Medication, EmergencyContact } from "../../shared/contract";
import { syncEngine } from "../sanjit/syncEngine";

interface PatientRecordsAuditProps {
  patient: PatientRecord;
  onRecordUpdated: (updated: PatientRecord) => void;
}

export const PatientRecordsAudit: React.FC<PatientRecordsAuditProps> = ({
  patient,
  onRecordUpdated,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(patient.name);
  const [age, setAge] = useState<number>(patient.age);
  const [stage, setStage] = useState<"early" | "moderate" | "severe">(patient.diagnosisStage);
  const [medications, setMedications] = useState<Medication[]>([...patient.medications]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([...patient.emergencyContacts]);
  const [updatedBy, setUpdatedBy] = useState<string>("Dr. B. K. Sarma (Clinician)");

  // New Medication Form
  const [newMedName, setNewMedName] = useState<string>("");
  const [newMedDosage, setNewMedDosage] = useState<string>("");
  const [newMedSchedule, setNewMedSchedule] = useState<string>("");

  const handleAddMedication = () => {
    if (!newMedName) return;
    setMedications([
      ...medications,
      {
        id: `med-${Date.now()}`,
        name: newMedName,
        dosage: newMedDosage || "10mg",
        schedule: newMedSchedule || "08:00 AM Daily",
      },
    ]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedSchedule("");
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleSaveRecord = () => {
    const newVersion = patient.version + 1;
    const historyEntry = {
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy,
      changes: {
        diagnosisStage: stage,
        medicationsCount: medications.length,
        contactsCount: contacts.length,
        note: `Updated medical regimen from v${patient.version} to v${newVersion}`,
      },
    };

    const updatedRecord: PatientRecord = {
      ...patient,
      name,
      age,
      diagnosisStage: stage,
      medications,
      emergencyContacts: contacts,
      updatedBy,
      updatedAt: new Date().toISOString(),
      version: newVersion,
      history: [...(patient.history || []), historyEntry],
    };

    // 1. Enqueue to Sanjit's sync queue
    syncEngine.enqueue("patient_record", updatedRecord, true);

    // 2. Notify parent state
    onRecordUpdated(updatedRecord);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">{patient.name}</h3>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-orange-950 text-orange-300 border border-orange-600/40 rounded">
                Version {patient.version}.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Age {patient.age} • Stage: <strong className="uppercase text-orange-400">{patient.diagnosisStage}</strong> • Last Updated by {patient.updatedBy}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            isEditing
              ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
              : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? "Cancel Edit" : "Edit Medical Record"}</span>
        </button>
      </div>

      {/* Edit Form or Read-only Display */}
      {isEditing ? (
        <div className="bg-slate-900/90 border border-orange-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-white text-sm">Update Patient Clinical Profile</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Diagnosis Stage:</label>
              <select
                value={stage}
                onChange={(e: any) => setStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="early">Early Stage</option>
                <option value="moderate">Moderate Stage</option>
                <option value="severe">Severe Stage</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Clinician Signature / Author:</label>
              <input
                type="text"
                value={updatedBy}
                onChange={(e) => setUpdatedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Add Medication Row */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-xs text-slate-400 font-semibold block">Add Medication:</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Drug Name (e.g. Rivastigmine)"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
              <input
                type="text"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 4.6mg patch)"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
              <input
                type="text"
                value={newMedSchedule}
                onChange={(e) => setNewMedSchedule(e.target.value)}
                placeholder="Schedule (e.g. 09:00 AM)"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold"
              >
                + Add Drug
              </button>
            </div>
          </div>

          {/* Current Medications in Draft */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold block">Current Regimen ({medications.length}):</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {medications.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{m.name}</span>
                    <span className="text-slate-400">{m.dosage} • {m.schedule}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(m.id)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveRecord}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Publish Version {patient.version + 1}.0 to Audit Log</span>
            </button>
          </div>
        </div>
      ) : (
        /* Read-Only Current Regimen Display */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Prescribed Medications ({patient.medications.length})
            </h4>
            <div className="space-y-2">
              {patient.medications.map((m) => (
                <div key={m.id} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{m.name}</span>
                    <span className="text-orange-400 font-mono">{m.dosage}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] block mt-0.5">{m.schedule}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Emergency Caregivers & Clinicians ({patient.emergencyContacts.length})
            </h4>
            <div className="space-y-2">
              {patient.emergencyContacts.map((c, idx) => (
                <div key={`cont-${idx}`} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{c.name} {c.isPrimary && <span className="text-emerald-400 text-[10px]">(Primary)</span>}</span>
                    <span className="text-slate-400">{c.relation}</span>
                  </div>
                  <span className="text-cyan-400 font-mono text-[11px] block mt-0.5">{c.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chronological Version Audit Trail Log */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-orange-400" />
          Chronological Medical Version History Log (Append-Only Audit)
        </h4>

        <div className="space-y-3">
          {(patient.history || []).map((h, idx) => (
            <div
              key={`hist-${idx}`}
              className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 font-mono text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-orange-400 font-bold">
                  Version {h.version}.0 • {h.updatedBy}
                </span>
                <span className="text-slate-500">{new Date(h.updatedAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-400 font-sans text-xs">
                {JSON.stringify(h.changes)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
