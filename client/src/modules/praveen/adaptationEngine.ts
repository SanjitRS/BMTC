export interface DifficultyProfile {
  level: number; // 1 to 5
  timeLimitSec: number;
  itemsCount: number;
  cueingLevel: "high" | "medium" | "low";
  name: string;
}

export const DIFFICULTY_LEVELS: Record<number, DifficultyProfile> = {
  1: { level: 1, timeLimitSec: 45, itemsCount: 4, cueingLevel: "high", name: "Gentle Orientation" },
  2: { level: 2, timeLimitSec: 35, itemsCount: 6, cueingLevel: "medium", name: "Familiar Recall" },
  3: { level: 3, timeLimitSec: 25, itemsCount: 8, cueingLevel: "medium", name: "Active Association" },
  4: { level: 4, timeLimitSec: 20, itemsCount: 10, cueingLevel: "low", name: "Sequential Challenge" },
  5: { level: 5, timeLimitSec: 15, itemsCount: 12, cueingLevel: "low", name: "Complex Synthesis" },
};

export interface AdaptationResult {
  previousLevel: number;
  newLevel: number;
  action: "PROMOTED" | "DEMOTED" | "MAINTAINED";
  reason: string;
  recommendedCueing: string;
}

export class AdaptationEngine {
  public evaluateNextDifficulty(
    currentLevel: number,
    accuracy: number,
    avgResponseTimeMs: number,
    errorTypes: string[]
  ): AdaptationResult {
    let newLevel = currentLevel;
    let action: "PROMOTED" | "DEMOTED" | "MAINTAINED" = "MAINTAINED";
    let reason = "Performance is stable. Maintaining current cognitive challenge level.";
    let recommendedCueing = "Standard prompts with subtle audio feedback.";

    const hasTimeouts = errorTypes.includes("timeout");
    const omissionErrors = errorTypes.filter((e) => e === "omission").length;
    const commissionErrors = errorTypes.filter((e) => e === "commission").length;

    // Progression Rule: Accuracy > 85% and speedy responses
    if (accuracy >= 85 && avgResponseTimeMs < 2500) {
      if (currentLevel < 5) {
        newLevel = currentLevel + 1;
        action = "PROMOTED";
        reason = `Outstanding recall (${accuracy}% accuracy, ${avgResponseTimeMs}ms latency). Advanced to Level ${newLevel}.`;
        recommendedCueing = "Reduced visual cues for independent problem solving.";
      } else {
        reason = "Consistently mastering Level 5 (Mastery ceiling reached).";
      }
    }
    // Regression Rule: Accuracy < 50% or multiple timeouts
    else if (accuracy < 50 || hasTimeouts) {
      if (currentLevel > 1) {
        newLevel = currentLevel - 1;
        action = "DEMOTED";
        reason = `Detected cognitive fatigue/stress (${accuracy}% accuracy, timeout detected). Reduced to Level ${newLevel} to preserve motivation.`;
        recommendedCueing = "Reinforced visual outlines, high-contrast highlights, and spoken hints.";
      } else {
        reason = "At baseline Level 1. Providing extra scaffolding and longer time allowances.";
        recommendedCueing = "Maximal multimodal scaffolding.";
      }
    }
    // Error Type Specialization
    else if (omissionErrors > commissionErrors) {
      reason = "Higher omission error rate detected (slight processing hesitation). Maintaining level with gentle timing cues.";
      recommendedCueing = "Gentle pulsing reminders on unexplored cards.";
    }

    return {
      previousLevel: currentLevel,
      newLevel,
      action,
      reason,
      recommendedCueing,
    };
  }
}

export const adaptationEngine = new AdaptationEngine();
