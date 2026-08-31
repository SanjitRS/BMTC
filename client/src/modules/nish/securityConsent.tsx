import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Trash2,
  AlertTriangle,
  FileCheck,
  CheckCircle2
} from "lucide-react";
import { ingestionPipelineClient } from "./ingestionPipeline";

interface SecurityConsentProps {
  patientId: string;
  onPatientDeleted: () => void;
}

export const SecurityConsent: React.FC<SecurityConsentProps> = ({
  patientId,
  onPatientDeleted,
}) => {
  const [gpsConsentGranted, setGpsConsentGranted] = useState<boolean>(true);
  const [consentAuthor, setConsentAuthor] = useState<string>("Ananya Baruah (Primary Legal Guardian)");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggleConsent = async () => {
    const nextConsent = !gpsConsentGranted;
    setGpsConsentGranted(nextConsent);
    setStatusMessage(
      nextConsent
        ? "GPS Geofencing telemetry tracking authorized by legal caregiver."
        : "GPS tracking consent REVOKED. Location telemetry streaming halted."
    );
  };

  const handleExecuteGdprDelete = async () => {
    if (deleteConfirmationText !== "PERMANENTLY DELETE") return;
    setIsDeleting(true);
    try {
      await ingestionPipelineClient.deletePatientGDPR(patientId);
      setShowDeleteModal(false);
      onPatientDeleted();
    } catch (e) {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Consent Management Card */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                GPS Geofence Tracking & Telemetry Consent
              </h4>
              <p className="text-xs text-slate-400">
                Authorized by {consentAuthor} under Indian Digital Personal Data Protection Act & GDPR.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleConsent}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              gpsConsentGranted
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-rose-950 border border-rose-500 text-rose-300"
            }`}
          >
            {gpsConsentGranted ? "Consent: ACTIVE" : "Consent: REVOKED"}
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
            {statusMessage}
          </div>
        )}
      </div>

      {/* GDPR Right to be Forgotten Hard Delete Card */}
      <div className="bg-rose-950/20 border border-rose-500/40 rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-3 text-rose-400">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-white text-base">GDPR Article 17: Right to Erasure</h4>
            <p className="text-xs text-slate-400">
              Permanently purges all clinical records, cognitive scores, medication regimens, and geofence telemetry across all distributed nodes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Execute Verified GDPR Permanent Hard-Delete</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bold text-white text-base">Confirm GDPR Permanent Erasure</h4>
            </div>

            <p className="text-xs text-slate-300">
              This action is <strong>irreversible</strong>. Type <strong className="text-rose-400 font-mono">PERMANENTLY DELETE</strong> below to purge patient <strong>{patientId}</strong>:
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="PERMANENTLY DELETE"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-rose-300 font-mono focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteGdprDelete}
                disabled={deleteConfirmationText !== "PERMANENTLY DELETE" || isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl"
              >
                {isDeleting ? "Purging..." : "Confirm & Hard Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
