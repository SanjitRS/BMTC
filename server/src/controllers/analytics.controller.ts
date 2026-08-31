import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { analyticsService } from '../services/analytics.service';
import { centralStore } from '../services/store.service';

export class AnalyticsController {
  public async getOrgAnalytics(req: AuthenticatedRequest, res: Response) {
    const data = analyticsService.getOrgAnalytics();
    return res.json(data);
  }

  public async getComplianceReport(req: AuthenticatedRequest, res: Response) {
    const patients = centralStore.getPatients();
    const rows = patients.map(p => {
      const scorecard = analyticsService.getPatientScorecard(p.patientId);
      return {
        patientId: p.patientId,
        name: p.name,
        diagnosisStage: p.diagnosisStage,
        cognitiveStatus: scorecard.cognitiveStatus,
        averageAccuracy: scorecard.averageAccuracy,
        totalSessions: scorecard.totalSessions,
        currentStreak: scorecard.currentStreakDays,
        adherenceRate: scorecard.adherenceRatePercent,
        locationConsent: p.locationTrackingConsent,
        lastUpdated: p.updatedAt
      };
    });

    return res.json({
      reportDate: new Date().toISOString(),
      generatedBy: req.user ? req.user.name : 'System Admin',
      patientRecords: rows
    });
  }
}

export const analyticsController = new AnalyticsController();
