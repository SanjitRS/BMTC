import { GameType, GameSession } from "../../shared/contract";
import { NER_CULTURAL_ITEMS, CulturalItem } from "./regionalContent";

export interface RoutineStep {
  id: string;
  order: number;
  title: string;
  timeLabel: string;
  icon: string;
}

export const DEFAULT_ROUTINE_STEPS: RoutineStep[] = [
  { id: "step-1", order: 1, title: "Morning Awakening & Stretch", timeLabel: "07:00 AM", icon: "🌅" },
  { id: "step-2", order: 2, title: "Morning Assam Tea & Biscuit", timeLabel: "07:30 AM", icon: "☕" },
  { id: "step-3", order: 3, title: "Take Donepezil 10mg Pill", timeLabel: "08:00 AM", icon: "💊" },
  { id: "step-4", order: 4, title: "Gentle Garden Stroll in Nehru Park", timeLabel: "10:30 AM", icon: "🌿" },
  { id: "step-5", order: 5, title: "Nutritious Lunch & Hydration", timeLabel: "01:00 PM", icon: "🍲" },
  { id: "step-6", order: 6, title: "Afternoon Power Rest", timeLabel: "02:30 PM", icon: "🛌" },
  { id: "step-7", order: 7, title: "Family Evening Call with Ananya", timeLabel: "06:00 PM", icon: "📞" },
  { id: "step-8", order: 8, title: "Night Medication & Sleep", timeLabel: "09:30 PM", icon: "🌙" },
];

export interface MemoryCard {
  id: string;
  symbol: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export class CognitiveEngines {
  // Generates randomized memory card deck for Level
  public generateMemoryDeck(level: number): MemoryCard[] {
    const pairCount = level === 1 ? 2 : level === 2 ? 3 : level === 3 ? 4 : level === 4 ? 5 : 6;
    const selected = NER_CULTURAL_ITEMS.slice(0, pairCount);

    const cards: MemoryCard[] = [];
    selected.forEach((item, index) => {
      cards.push({
        id: `card-${index}-a`,
        symbol: item.icon,
        name: item.name,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `card-${index}-b`,
        symbol: item.icon,
        name: item.name,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    return cards.sort(() => Math.random() - 0.5);
  }

  // Generates shuffled daily routine steps for patient to organize
  public generateShuffledRoutine(count: number = 4): { correct: RoutineStep[]; shuffled: RoutineStep[] } {
    const subset = DEFAULT_ROUTINE_STEPS.slice(0, count);
    const shuffled = [...subset].sort(() => Math.random() - 0.5);
    return {
      correct: subset,
      shuffled,
    };
  }

  // Attention target generator
  public generateAttentionChallenge(level: number): {
    target: CulturalItem;
    grid: CulturalItem[];
    targetCount: number;
  } {
    const target = NER_CULTURAL_ITEMS[Math.floor(Math.random() * NER_CULTURAL_ITEMS.length)];
    const totalItems = level * 3 + 3;
    const targetCount = Math.max(2, Math.floor(level * 1.5));

    const grid: CulturalItem[] = [];
    for (let i = 0; i < targetCount; i++) {
      grid.push(target);
    }

    while (grid.length < totalItems) {
      const other = NER_CULTURAL_ITEMS[Math.floor(Math.random() * NER_CULTURAL_ITEMS.length)];
      if (other.id !== target.id) {
        grid.push(other);
      }
    }

    return {
      target,
      grid: grid.sort(() => Math.random() - 0.5),
      targetCount,
    };
  }
}

export const cognitiveEngines = new CognitiveEngines();
