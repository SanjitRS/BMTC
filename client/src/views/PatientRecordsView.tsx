import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Pill, 
  Phone, 
  History, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Lock,
  Edit3
} from 'lucide-react';
import { api } from '../api/client';
import { PatientRecord, Medication, EmergencyContact } from '../types/contract';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AuditDiffModal } from '../components/AuditDiffModal';

interface PatientRecordsViewProps {
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
}

export const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({ selectedPatientId, onSelectPatient }) => {
  const { t } = useLanguage();
  const { role, user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Form State
  const [diagnosisStage, setDiagnosisStage] = useState<'early' | 'moderate' | 'severe'>('early');
  const [notes, setNotes] = useState<string>('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [changesSummary, setChangesSummary] = useState<string>('Routine clinical medication adjustment');

  const canEdit = role === 'admin' || role === 'healthcare_worker';

  const loadData = async (id: string) => {
    setLoading(true);
    setSaveSuccess(null);
    setErrorMessage(null);
    try {
      const [patList, p] = await Promise.all([
        api.getPatients(),
        api.getPatientById(id)
      ]);
      setPatients(patList);
      setPatient(p);
      setDiagnosisStage(p.diagnosisStage);
      setNotes(p.notes || '');
      setMedications(JSON.parse(JSON.stringify(p.medications || [])));
      setEmergencyContacts(JSON.parse(JSON.stringify(p.emergencyContacts || [])));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedPatientId || 'pat_001');
  }, [selectedPatientId]);

  const handleAddMedication = () => {
    const newMed: Medication = {
      id: 'med_' + Math.random().toString(36).substr(2, 6),
      name: '',
      dosage: '',
      frequency: 'Daily',
      scheduledTimes: ['08:00'],
      purpose: ''
    };
    setMedications([...medications, newMed]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handleUpdateMedication = (id: string, field: keyof Medication, val: any) => {
    setMedications(medications.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const handleAddContact = () => {
    const newContact: EmergencyContact = {
      id: 'ec_' + Math.random().toString(36).substr(2, 6),
      name: '',
      relationship: 'Caregiver',
      phone: '+91 ',
      isPrimary: emergencyContacts.length === 0
    };
    setEmergencyContacts([...emergencyContacts, newContact]);
  };

  const handleRemoveContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
  };

  const handleUpdateContact = (id: string, field: keyof EmergencyContact, val: any) => {
    setEmergencyContacts(emergencyContacts.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !patient) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const res = await api.updateMedicalRecord(patient.patientId, {
        diagnosisStage,
        notes,
        medications,
        emergencyContacts,
        changesSummary: changesSummary || `Clinical record update by ${user?.name || 'Practitioner'}`
      });

      setSaveSuccess(`Patient record version successfully incremented from v${patient.version} to v${res.currentVersion}! Audit snapshot preserved.`);
      await loadData(patient.patientId);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <span className="text-sm font-semibold">Loading Clinical Record & Audit Logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">{t('nav.records')}</h2>
                <span className="bg-indigo-500/20 text-indigo-300 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Version: v{patient.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured clinical charts, version-controlled with immutable audit diff trails.
              </p>
            </div>
          </div>
        </div>

        {/* Patient Switcher & Audit History Button */}
        <div className="flex items-center gap-3">
          <select
            value={patient.patientId}
            onChange={e => onSelectPatient(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-teal-500"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.patientId}) • v{p.version}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-teal-400" />
            <span>{t('btn.audit_history')} ({patient.history?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="font-medium">{saveSuccess}</div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-lg animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}

      {/* RBAC Warning Banner for Caregivers */}
      {!canEdit && (
        <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl flex items-center gap-3 text-amber-200 text-xs">
          <Lock className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>Read-Only Access:</strong> As a Caregiver, you have viewing permissions for medical charts. Only Healthcare Workers and Clinical Admins can modify dosages and diagnose stages.
          </div>
        </div>
      )}

      {/* Record Edit Form */}
      <form onSubmit={handleSaveRecord} className="space-y-6">
        {/* Core Clinical Parameters */}
        <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-teal-400" />
            <span>Diagnostic Profile & Care Notes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Diagnosis Stage</label>
              <select
                disabled={!canEdit}
                value={diagnosisStage}
                onChange={e => setDiagnosisStage(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
              >
                <option value="early">Early Stage (Mild Cognitive Impairment)</option>
                <option value="moderate">Moderate Stage (Memory & Spatial Loss)</option>
                <option value="severe">Severe Stage (Full Clinical Dependency)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Clinical & Behavioral Notes</label>
              <input
                type="text"
                disabled={!canEdit}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Clinical observations, triggers, favorite cultural memories..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Medications Module */}
        <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <span>Prescription Medications & Administration Schedule</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={handleAddMedication}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {medications.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-900/60 rounded-xl">No active medications registered.</p>
            ) : (
              medications.map((med, index) => (
                <div key={med.id || index} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Medication Name</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={med.name}
                      onChange={e => handleUpdateMedication(med.id, 'name', e.target.value)}
                      placeholder="e.g. Donepezil"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Dosage</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={med.dosage}
                      onChange={e => handleUpdateMedication(med.id, 'dosage', e.target.value)}
                      placeholder="e.g. 10mg"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Frequency</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={med.frequency}
                      onChange={e => handleUpdateMedication(med.id, 'frequency', e.target.value)}
                      placeholder="e.g. Once daily at bedtime"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">Clinical Purpose</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={med.purpose}
                      onChange={e => handleUpdateMedication(med.id, 'purpose', e.target.value)}
                      placeholder="e.g. Cholinesterase inhibitor"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-4 sm:pt-0">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Contacts Module */}
        <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Emergency Contacts & Caregivers</span>
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={handleAddContact}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, index) => (
              <div key={contact.id || index} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {contact.isPrimary ? '🌟 Primary Contact' : 'Secondary Contact'}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Name</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={contact.name}
                      onChange={e => handleUpdateContact(contact.id, 'name', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Relationship</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={contact.relationship}
                      onChange={e => handleUpdateContact(contact.id, 'relationship', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block">Phone Number</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={contact.phone}
                    onChange={e => handleUpdateContact(contact.id, 'phone', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Reason & Submit Bar */}
        {canEdit && (
          <div className="p-6 bg-slate-850 border border-teal-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="w-full sm:w-2/3">
              <label className="block text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                Audit Trail Reason (Recorded in Version History)
              </label>
              <input
                type="text"
                value={changesSummary}
                onChange={e => setChangesSummary(e.target.value)}
                placeholder="Reason for medication/dosage/stage revision..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Incrementing Version...' : `Save & Bump to v${patient.version + 1}`}</span>
            </button>
          </div>
        )}
      </form>

      {/* Audit History Modal */}
      <AuditDiffModal
        patientId={patient.patientId}
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};
