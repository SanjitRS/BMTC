import { GameType } from "../../shared/contract";

export interface InterruptedSessionState {
  patientId: string;
  gameType: GameType;
  difficultyLevel: number;
  progressPercent: number;
  currentScore: number;
  elapsedSeconds: number;
  serializedGameState: string;
  savedAt: string;
}

const STORAGE_KEY = "gurugale_praveen_interrupted_session";

export class InterruptionStateManager {
  public saveSession(state: InterruptedSessionState) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }

  public getSavedSession(): InterruptedSessionState | null {
    if (typeof window !== "undefined") {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        try {
          return JSON.parse(item);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  public clearSavedSession() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const interruptionStateManager = new InterruptionStateManager();
