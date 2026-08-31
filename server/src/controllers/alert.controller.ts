import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { centralStore } from '../services/store.service';

export class AlertController {
  public async getAlerts(req: AuthenticatedRequest, res: Response) {
    const { patientId, severity, status } = req.query as { patientId?: string; severity?: string; status?: string };
    let alerts = centralStore.getAlerts(patientId);

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }

    return res.json(alerts);
  }

  public async acknowledgeAlert(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userName = req.user ? req.user.name : 'Caregiver on duty';

    try {
      const updated = centralStore.updateAlertStatus(id, 'acknowledged', userName);
      return res.json({
        message: `Alert ${id} acknowledged by ${userName}`,
        alert: updated
      });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  public async resolveAlert(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userName = req.user ? req.user.name : 'Caregiver on duty';

    try {
      const updated = centralStore.updateAlertStatus(id, 'resolved', userName);
      return res.json({
        message: `Alert ${id} marked as resolved`,
        alert: updated
      });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  public async dispatchCaregiver(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { caregiverName, contactNumber, notes } = req.body;
    const alerts = centralStore.getAlerts();
    const alert = alerts.find(a => a.id === id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.summary += ` | [DISPATCHED] Caregiver ${caregiverName || 'Emergency Support'} (${contactNumber || 'On Call'}) dispatched at ${new Date().toLocaleTimeString()}. ${notes || ''}`;
    alert.status = 'acknowledged';
    alert.acknowledgedBy = req.user ? req.user.name : 'Clinical Admin';
    alert.acknowledgedAt = new Date().toISOString();

    centralStore.saveAlert(alert);

    return res.json({
      message: `Emergency response dispatched for ${alert.patientName}`,
      alert
    });
  }
}

export const alertController = new AlertController();
