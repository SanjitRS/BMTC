import { Router, Request, Response } from "express";

export const praveenRouter = Router();

// Cognitive difficulty matrix definitions
const difficultyRules = {
  levels: [
    { level: 1, name: "Gentle Orientation", timeLimitSec: 45, itemsCount: 4, promptComplexity: "low" },
    { level: 2, name: "Familiar Recall", timeLimitSec: 35, itemsCount: 6, promptComplexity: "medium" },
    { level: 3, name: "Active Association", timeLimitSec: 25, itemsCount: 8, promptComplexity: "medium" },
    { level: 4, name: "Sequential Challenge", timeLimitSec: 20, itemsCount: 10, promptComplexity: "high" },
    { level: 5, name: "Complex Pattern Synthesis", timeLimitSec: 15, itemsCount: 12, promptComplexity: "expert" },
  ],
  rules: [
    { condition: "accuracy > 85% && avgResponseTimeMs < 2000", action: "level_up" },
    { condition: "accuracy < 50% || timeouts > 2", action: "level_down" },
    { condition: "omission_errors > commission_errors", action: "increase_cueing" },
    { condition: "otherwise", action: "maintain_level" },
  ],
  regionalThemes: [
    { region: "Assam", items: ["Bihu Dhol", "Eri Silk", "Kaziranga Rhino", "Jaapi Hat"] },
    { region: "Nagaland", items: ["Hornbill Feathers", "Naga Shawl", "Dzukou Valley Lily", "Bamboo Mug"] },
    { region: "Manipur", items: ["Loktak Phumdi", "Manipuri Dance Raas", "Kangla Fort", "Pena Fiddle"] },
    { region: "Meghalaya", items: ["Living Root Bridge", "Nohkalikai Falls", "Khasi Monolith", "Pineapple Orchards"] },
  ],
};

praveenRouter.get("/rules", (_req: Request, res: Response) => {
  return res.json({ difficultyRules });
});

praveenRouter.post("/evaluate-level", (req: Request, res: Response) => {
  const { currentLevel, accuracy, avgResponseTimeMs, errorTypes } = req.body;
  let nextLevel = currentLevel || 1;
  let recommendation = "Maintain current difficulty for consolidation.";

  if (accuracy > 85 && avgResponseTimeMs < 2500) {
    nextLevel = Math.min(5, currentLevel + 1);
    recommendation = "High accuracy & rapid recall. Promoted to next cognitive level.";
  } else if (accuracy < 50 || (errorTypes && errorTypes.includes("timeout"))) {
    nextLevel = Math.max(1, currentLevel - 1);
    recommendation = "Cognitive strain detected. Decreased difficulty to reduce frustration.";
  }

  return res.json({
    currentLevel,
    nextLevel,
    recommendation,
    calculatedAt: new Date().toISOString(),
  });
});
