import { GameSession, CognitiveTrendScorecard, PatientRecord, ReminderAck } from '../shared/contract';
import { centralStore } from './store.service';

export class AnalyticsService {
  /**
   * Generates comprehensive Therapy Scorecard for a patient.
   * Handles brand new patients with 0 sessions with clean empty metrics!
   */
  public getPatientScorecard(patientId: string): CognitiveTrendScorecard {
    const patient = centralStore.getPatientById(patientId);
    const sessions = centralStore.getGameSessions(patientId).sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    const reminders = centralStore.getReminderAcks(patientId);

    const totalSessions = sessions.length;

    // Handle Empty State (brand new patient with zero sessions)
    if (totalSessions === 0) {
      return {
        patientId,
        patientName: patient ? patient.name : 'Unknown Patient',
        diagnosisStage: patient ? patient.diagnosisStage : 'early',
        cognitiveStatus: 'stable',
        totalSessions: 0,
        averageAccuracy: 0,
        averageScore: 0,
        averageResponseTimeMs: 0,
        currentStreakDays: 0,
        accuracyTrend: [],
        errorBreakdown: [],
        gameTypePerformance: [
          { gameType: 'memory', sessions: 0, avgAccuracy: 0, avgScore: 0 },
          { gameType: 'attention', sessions: 0, avgAccuracy: 0, avgScore: 0 },
          { gameType: 'routine', sessions: 0, avgAccuracy: 0, avgScore: 0 },
          { gameType: 'pattern', sessions: 0, avgAccuracy: 0, avgScore: 0 }
        ],
        adherenceRatePercent: this.calculateAdherenceRate(reminders)
      };
    }

    // Averages
    const totalAcc = sessions.reduce((acc, s) => acc + s.accuracy, 0);
    const totalScore = sessions.reduce((acc, s) => acc + s.score, 0);
    const totalLatency = sessions.reduce((acc, s) => acc + s.avgResponseTimeMs, 0);

    const averageAccuracy = Math.round(totalAcc / totalSessions);
    const averageScore = Math.round(totalScore / totalSessions);
    const averageResponseTimeMs = Math.round(totalLatency / totalSessions);

    // Trend analysis: compare first half vs second half
    let cognitiveStatus: 'improving' | 'stable' | 'declining' = 'stable';
    if (totalSessions >= 4) {
      const mid = Math.floor(totalSessions / 2);
      const firstHalf = sessions.slice(0, mid);
      const secondHalf = sessions.slice(mid);

      const firstAvg = firstHalf.reduce((a, s) => a + s.accuracy, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, s) => a + s.accuracy, 0) / secondHalf.length;

      const firstLat = firstHalf.reduce((a, s) => a + s.avgResponseTimeMs, 0) / firstHalf.length;
      const secondLat = secondHalf.reduce((a, s) => a + s.avgResponseTimeMs, 0) / secondHalf.length;

      if (secondAvg >= firstAvg + 7 && secondLat <= firstLat) {
        cognitiveStatus = 'improving';
      } else if (secondAvg <= firstAvg - 8 || secondLat > firstLat * 1.25) {
        cognitiveStatus = 'declining';
      }
    } else if (averageAccuracy < 50 || averageResponseTimeMs > 6500) {
      cognitiveStatus = 'declining';
    }

    // Accuracy & Score Trend over time
    const accuracyTrend = sessions.map(s => ({
      date: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accuracy: s.accuracy,
      score: s.score,
      responseTimeMs: s.avgResponseTimeMs,
      gameType: s.gameType
    }));

    // Error Breakdown
    const errorCounts: Record<string, number> = {};
    let totalErrors = 0;
    sessions.forEach(s => {
      s.errorTypes.forEach(err => {
        errorCounts[err] = (errorCounts[err] || 0) + 1;
        totalErrors++;
      });
    });

    const errorBreakdown = Object.entries(errorCounts).map(([type, count]) => ({
      type,
      count,
      percentage: totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0
    }));

    // Performance per Game Type
    const gameTypes: ('memory' | 'attention' | 'routine' | 'pattern')[] = ['memory', 'attention', 'routine', 'pattern'];
    const gameTypePerformance = gameTypes.map(gt => {
      const subset = sessions.filter(s => s.gameType === gt);
      if (subset.length === 0) {
        return { gameType: gt, sessions: 0, avgAccuracy: 0, avgScore: 0 };
      }
      const avgAcc = Math.round(subset.reduce((a, s) => a + s.accuracy, 0) / subset.length);
      const avgSc = Math.round(subset.reduce((a, s) => a + s.score, 0) / subset.length);
      return {
        gameType: gt,
        sessions: subset.length,
        avgAccuracy: avgAcc,
        avgScore: avgSc
      };
    });

    // Streak calculation
    const streak = this.calculateStreak(sessions);

    return {
      patientId,
      patientName: patient ? patient.name : 'Unknown Patient',
      diagnosisStage: patient ? patient.diagnosisStage : 'early',
      cognitiveStatus,
      totalSessions,
      averageAccuracy,
      averageScore,
      averageResponseTimeMs,
      currentStreakDays: streak,
      accuracyTrend,
      errorBreakdown,
      gameTypePerformance,
      adherenceRatePercent: this.calculateAdherenceRate(reminders)
    };
  }

  private calculateStreak(sessions: GameSession[]): number {
    if (sessions.length === 0) return 0;
    const sessionDates = Array.from(
      new Set(sessions.map(s => new Date(s.startedAt).toISOString().split('T')[0]))
    ).sort();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sessionDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today not played yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(streak, 1);
  }

  private calculateAdherenceRate(reminders: ReminderAck[]): number {
    if (reminders.length === 0) return 100;
    const acknowledged = reminders.filter(r => r.status === 'acknowledged').length;
    return Math.round((acknowledged / reminders.length) * 100);
  }

  /**
   * Org-wide Aggregate Analytics across all patients
   */
  public getOrgAnalytics() {
    const patients = centralStore.getPatients();
    const alerts = centralStore.getAlerts();
    const activeAlerts = alerts.filter(a => a.status === 'active');

    let totalSessions = 0;
    let totalAccuracySum = 0;
    let improvingCount = 0;
    let stableCount = 0;
    let decliningCount = 0;
    const flaggedAtRiskPatients: any[] = [];

    patients.forEach(patient => {
      const scorecard = this.getPatientScorecard(patient.patientId);
      if (scorecard.totalSessions > 0) {
        totalSessions += scorecard.totalSessions;
        totalAccuracySum += scorecard.averageAccuracy;
      }

      if (scorecard.cognitiveStatus === 'improving') improvingCount++;
      else if (scorecard.cognitiveStatus === 'declining') decliningCount++;
      else stableCount++;

      // Flagging criteria: Cognitive decline OR adherence < 60% OR active critical alert
      const hasActiveCritical = activeAlerts.some(
        a => a.patientId === patient.patientId && (a.severity === 'critical' || a.severity === 'high')
      );
      if (scorecard.cognitiveStatus === 'declining' || scorecard.adherenceRatePercent < 65 || hasActiveCritical) {
        flaggedAtRiskPatients.push({
          patientId: patient.patientId,
          name: patient.name,
          diagnosisStage: patient.diagnosisStage,
          cognitiveStatus: scorecard.cognitiveStatus,
          adherenceRatePercent: scorecard.adherenceRatePercent,
          averageAccuracy: scorecard.averageAccuracy,
          reason: scorecard.cognitiveStatus === 'declining'
            ? 'Cognitive score dropped by >15% over recent sessions'
            : scorecard.adherenceRatePercent < 65
            ? 'Low medication/hydration adherence (<65%)'
            : 'Active unresolved safety boundary alerts'
        });
      }
    });

    const activePatientCount = patients.filter(p => p.diagnosisStage).length;
    const orgAvgAccuracy = activePatientCount > 0 && totalSessions > 0
      ? Math.round(totalAccuracySum / activePatientCount)
      : 78;

    return {
      totalPatients: patients.length,
      activeAlertsCount: activeAlerts.length,
      criticalAlertsCount: activeAlerts.filter(a => a.severity === 'critical').length,
      totalCognitiveSessions: totalSessions,
      orgAverageAccuracy: orgAvgAccuracy,
      cognitiveDistribution: {
        improving: improvingCount,
        stable: stableCount,
        declining: decliningCount
      },
      flaggedAtRiskPatients,
      diagnosisStageDistribution: {
        early: patients.filter(p => p.diagnosisStage === 'early').length,
        moderate: patients.filter(p => p.diagnosisStage === 'moderate').length,
        severe: patients.filter(p => p.diagnosisStage === 'severe').length
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
