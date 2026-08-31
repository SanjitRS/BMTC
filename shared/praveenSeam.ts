/**
 * PRAVEEN INTEGRATION SEAM: Cognitive Engine & Therapy Simulation
 * 
 * Generates valid GameSession, ReminderAck, and difficulty adaptation
 * writes directly to Sanjit's enqueue()
 */

import { GameSession, ReminderAck } from './contract';
import { enqueue } from './sanjitSeam';

export interface AdaptiveDifficultyResult {
  currentDifficulty: number;
  nextDifficulty: number;
  reason: string;
  accuracy: number;
  avgResponseTimeMs: number;
  errorTypes: string[];
}

export class PraveenCognitiveEngine {
  /**
   * Evaluates a completed session and computes adaptive difficulty (1 to 5)
   */
  public calculateAdaptiveDifficulty(session: Partial<GameSession>): AdaptiveDifficultyResult {
    const currentDiff = session.difficultyLevel || 2;
    const accuracy = session.accuracy || 70;
    const latency = session.avgResponseTimeMs || 3500;
    const errorTypes = session.errorTypes || [];

    let nextDiff = currentDiff;
    let reason = 'Performance stable. Maintaining current cognitive challenge.';

    // High accuracy + quick reaction -> elevate level
    if (accuracy >= 85 && latency < 4000) {
      nextDiff = Math.min(5, currentDiff + 1);
      reason = 'High precision (>85%) and rapid recall. Elevating cognitive difficulty.';
    } 
    // Severe error rate or timeout slowdown -> decrease level
    else if (accuracy < 55 || latency > 7500 || errorTypes.includes('timeout')) {
      nextDiff = Math.max(1, currentDiff - 1);
      reason = 'Elevated frustration/latency detected. Lowering difficulty for positive reinforcement.';
    }

    return {
      currentDifficulty: currentDiff,
      nextDifficulty: nextDiff,
      reason,
      accuracy,
      avgResponseTimeMs: latency,
      errorTypes
    };
  }

  /**
   * Simulates playing a game session and enqueues to Sanjit's queue
   */
  public async submitSession(
    patientId: string,
    gameType: 'memory' | 'attention' | 'routine' | 'pattern',
    score: number,
    accuracy: number,
    avgResponseTimeMs: number,
    errorTypes: string[] = [],
    difficultyLevel: number = 2,
    moodAfter?: 'very_happy' | 'calm' | 'neutral' | 'confused' | 'agitated'
  ): Promise<GameSession> {
    const started = new Date(Date.now() - 120000).toISOString();
    const ended = new Date().toISOString();

    const session: GameSession = {
      id: 'sess_' + Math.random().toString(36).substr(2, 9),
      patientId,
      gameType,
      startedAt: started,
      endedAt: ended,
      score,
      accuracy,
      avgResponseTimeMs,
      errorTypes,
      difficultyLevel,
      moodAfter,
      synced: false
    };

    // Push to Sanjit's offline sync queue
    await enqueue('game_session', session);
    return session;
  }

  /**
   * Simulates acknowledging or missing a reminder
   */
  public async submitReminderAck(
    patientId: string,
    reminderType: 'medicine' | 'hydration' | 'activity' | 'appointment',
    status: 'acknowledged' | 'snoozed' | 'missed',
    notes?: string
  ): Promise<ReminderAck> {
    const scheduled = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const ackedAt = status === 'acknowledged' ? new Date().toISOString() : null;

    const reminder: ReminderAck = {
      id: 'rem_' + Math.random().toString(36).substr(2, 9),
      patientId,
      reminderType,
      scheduledAt: scheduled,
      ackedAt,
      status,
      notes,
      synced: false
    };

    await enqueue('reminder_ack', reminder);
    return reminder;
  }
}

export const praveenCognitiveEngine = new PraveenCognitiveEngine();
