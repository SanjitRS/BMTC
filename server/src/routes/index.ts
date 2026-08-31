import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { syncController } from '../controllers/sync.controller';
import { patientController } from '../controllers/patient.controller';
import { geofenceController } from '../controllers/geofence.controller';
import { alertController } from '../controllers/alert.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { simulatorController } from '../controllers/simulator.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// --- Auth Routes ---
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/switch-role', (req, res) => authController.switchRole(req, res));
router.get('/auth/me', authenticateJwt, (req, res) => authController.getMe(req, res));
router.get('/auth/users', (req, res) => authController.getUsers(req, res));

// --- Central Ingestion Pipeline (Section 3 Core) ---
router.post('/sync/batch', (req, res) => syncController.ingestBatch(req, res));
router.get('/sync/status', (req, res) => syncController.getStatus(req, res));

// --- Patients & Clinical Scorecard ---
router.get('/patients', authenticateJwt, (req, res) => patientController.getRoster(req, res));
router.post('/patients', authenticateJwt, requireRole(['admin', 'healthcare_worker']), (req, res) => patientController.createPatient(req, res));
router.get('/patients/:id', authenticateJwt, (req, res) => patientController.getPatientById(req, res));
router.get('/patients/:id/scorecard', authenticateJwt, (req, res) => patientController.getPatientScorecard(req, res));
router.put('/patients/:id/records', authenticateJwt, requireRole(['admin', 'healthcare_worker']), (req, res) => patientController.updateMedicalRecord(req, res));
router.get('/patients/:id/history', authenticateJwt, (req, res) => patientController.getAuditHistory(req, res));
router.post('/patients/:id/consent', authenticateJwt, requireRole(['admin', 'healthcare_worker']), (req, res) => patientController.setLocationConsent(req, res));
router.delete('/patients/:id/gdpr-delete', authenticateJwt, requireRole(['admin']), (req, res) => patientController.purgePatientGdpr(req, res));

// --- Geofence & GPS Telemetry ---
router.get('/geofence/zones/:patientId', authenticateJwt, (req, res) => geofenceController.getSafeZones(req, res));
router.post('/geofence/zones/:patientId', authenticateJwt, requireRole(['admin', 'healthcare_worker']), (req, res) => geofenceController.updateSafeZones(req, res));
router.get('/geofence/events/:patientId', authenticateJwt, (req, res) => geofenceController.getEvents(req, res));
router.get('/geofence/breadcrumbs/:patientId', authenticateJwt, (req, res) => geofenceController.getBreadcrumbs(req, res));

// --- Deduplicated Alerts ---
router.get('/alerts', authenticateJwt, (req, res) => alertController.getAlerts(req, res));
router.post('/alerts/:id/acknowledge', authenticateJwt, (req, res) => alertController.acknowledgeAlert(req, res));
router.post('/alerts/:id/resolve', authenticateJwt, (req, res) => alertController.resolveAlert(req, res));
router.post('/alerts/:id/dispatch', authenticateJwt, (req, res) => alertController.dispatchCaregiver(req, res));

// --- Org-Wide Analytics ---
router.get('/analytics/org', authenticateJwt, (req, res) => analyticsController.getOrgAnalytics(req, res));
router.get('/analytics/compliance', authenticateJwt, (req, res) => analyticsController.getComplianceReport(req, res));

// --- Ingestion Simulator ---
router.post('/simulator/generate-sync', (req, res) => simulatorController.generateSimulatedSync(req, res));

export default router;
