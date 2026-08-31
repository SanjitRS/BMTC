import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Sparkles,
  Zap,
  Clock,
  Award,
  Smile,
  Bell,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import { adaptationEngine, DIFFICULTY_LEVELS, AdaptationResult } from "./adaptationEngine";
import { cognitiveEngines, MemoryCard, RoutineStep } from "./cognitiveEngines";
import { NER_CULTURAL_ITEMS, CulturalItem } from "./regionalContent";
import { reminderAckEngine, PRESET_REMINDERS, ScheduledReminder } from "./reminderAckEngine";
import { DEMENTIA_MOOD_OPTIONS, DementiaMood } from "./moodCheckinEngine";
import { interruptionStateManager } from "./interruptionState";
import { syncEngine } from "../sanjit/syncEngine";
import { GameSession, GameType } from "../../shared/contract";
import { Language, translations } from "../../locales/i18n";

interface PraveenSectionViewProps {
  currentLang: Language;
  patientId?: string;
}

export const PraveenSectionView: React.FC<PraveenSectionViewProps> = ({
  currentLang,
  patientId = "patient-101",
}) => {
  const t = translations[currentLang] || translations.en;

  // Selected game & Level
  const [selectedGame, setSelectedGame] = useState<GameType>("memory");
  const [currentLevel, setCurrentLevel] = useState<number>(2);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [timerSeconds, setTimerSeconds] = useState<number>(DIFFICULTY_LEVELS[2].timeLimitSec);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [attempts, setAttempts] = useState<number>(0);
  const [correctMatches, setCorrectMatches] = useState<number>(0);
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [lastAdaptation, setLastAdaptation] = useState<AdaptationResult | null>(null);

  // Memory Game State
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  // Routine Game State
  const [routineChallenge, setRoutineChallenge] = useState<{ correct: RoutineStep[]; shuffled: RoutineStep[] }>({
    correct: [],
    shuffled: [],
  });
  const [placedSteps, setPlacedSteps] = useState<RoutineStep[]>([]);

  // Attention Game State
  const [attentionChallenge, setAttentionChallenge] = useState<{
    target: CulturalItem;
    grid: CulturalItem[];
    targetCount: number;
  } | null>(null);
  const [foundTargets, setFoundTargets] = useState<number>(0);

  // Mood Tracker State
  const [selectedMood, setSelectedMood] = useState<DementiaMood | null>(null);

  // Reminder State
  const [activeReminders, setActiveReminders] = useState<ScheduledReminder[]>(PRESET_REMINDERS);
  const [remindersFeed, setRemindersFeed] = useState<Array<{ id: string; title: string; status: string; time: string }>>([]);

  // Session timer ref
  const timerRef = useRef<any>(null);

  // Initialize Game on Mount or Mode/Level Change
  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedGame, currentLevel]);

  const startNewGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const profile = DIFFICULTY_LEVELS[currentLevel] || DIFFICULTY_LEVELS[1];
    setTimerSeconds(profile.timeLimitSec);
    setScore(0);
    setAttempts(0);
    setCorrectMatches(0);
    setAccuracy(100);
    setErrorTypes([]);
    setGameCompleted(false);
    setIsGameActive(true);
    setSessionStartTime(Date.now());
    setSelectedMood(null);

    if (selectedGame === "memory") {
      setCards(cognitiveEngines.generateMemoryDeck(currentLevel));
      setFlippedCardIds([]);
    } else if (selectedGame === "routine") {
      const challenge = cognitiveEngines.generateShuffledRoutine(Math.min(3 + currentLevel, 6));
      setRoutineChallenge(challenge);
      setPlacedSteps([]);
    } else if (selectedGame === "attention") {
      setAttentionChallenge(cognitiveEngines.generateAttentionChallenge(currentLevel));
      setFoundTargets(0);
    } else if (selectedGame === "pattern") {
      setCards(cognitiveEngines.generateMemoryDeck(currentLevel));
      setFlippedCardIds([]);
    }

    // Start Countdown
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    setErrorTypes((prev) => [...prev, "timeout"]);
    finishGame(false, "Timeout reached");
  };

  // Memory Card Click Handler
  const handleCardClick = (cardId: string) => {
    if (!isGameActive || flippedCardIds.length >= 2) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedCardIds, cardId];
    setFlippedCardIds(newFlipped);

    if (newFlipped.length === 2) {
      setAttempts((a) => a + 1);
      const firstCard = cards.find((c) => c.id === newFlipped[0]);
      const secondCard = card;

      if (firstCard && firstCard.symbol === secondCard.symbol) {
        // MATCH!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedCardIds([]);
          setCorrectMatches((m) => {
            const nextM = m + 1;
            const targetMatches = cards.length / 2;
            if (nextM >= targetMatches) {
              finishGame(true, "All cards successfully paired!");
            }
            return nextM;
          });
          setScore((s) => s + 250);
        }, 500);
      } else {
        // MISMATCH
        setErrorTypes((e) => [...e, "commission"]);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard?.id || c.id === secondCard.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCardIds([]);
        }, 900);
      }
    }
  };

  // Routine Step Click Handler
  const handleRoutineStepClick = (step: RoutineStep) => {
    if (placedSteps.some((p) => p.id === step.id)) return;
    const nextPlaced = [...placedSteps, step];
    setPlacedSteps(nextPlaced);

    if (nextPlaced.length === routineChallenge.correct.length) {
      // Check correctness
      let errors = 0;
      nextPlaced.forEach((st, idx) => {
        if (st.id !== routineChallenge.correct[idx].id) {
          errors += 1;
        }
      });

      if (errors === 0) {
        setScore(800);
        finishGame(true, "Daily routine ordered in exact sequence!");
      } else {
        setErrorTypes((e) => [...e, "omission"]);
        setScore(Math.max(200, 800 - errors * 150));
        finishGame(false, `Completed with ${errors} sequence mismatches.`);
      }
    }
  };

  // Attention Grid Click Handler
  const handleAttentionClick = (item: CulturalItem, index: number) => {
    if (!attentionChallenge || !isGameActive) return;
    if (item.id === attentionChallenge.target.id) {
      const nextFound = foundTargets + 1;
      setFoundTargets(nextFound);
      setScore((s) => s + 150);
      if (nextFound >= attentionChallenge.targetCount) {
        finishGame(true, "All visual target patterns identified!");
      }
    } else {
      setErrorTypes((e) => [...e, "commission"]);
    }
  };

  // Finish Game & Write Directly to Sanjit's Sync Queue!
  const finishGame = (won: boolean, note: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameActive(false);
    setGameCompleted(true);

    if (won) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }

    const elapsedMs = Date.now() - sessionStartTime;
    const totalActions = attempts > 0 ? attempts : 1;
    const finalAccuracy = won ? Math.max(70, Math.round(100 - (errorTypes.length / totalActions) * 20)) : 45;
    setAccuracy(finalAccuracy);

    // Evaluate dynamic adaptation
    const adaptation = adaptationEngine.evaluateNextDifficulty(
      currentLevel,
      finalAccuracy,
      Math.round(elapsedMs / (totalActions || 1)),
      errorTypes
    );
    setLastAdaptation(adaptation);

    // BUILD SECTION 0 GAME SESSION CONTRACT
    const session: GameSession = {
      id: `game-sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      gameType: selectedGame,
      startedAt: new Date(sessionStartTime).toISOString(),
      endedAt: new Date().toISOString(),
      score: score > 0 ? score : won ? 600 : 200,
      accuracy: finalAccuracy,
      avgResponseTimeMs: Math.round(elapsedMs / (totalActions || 1)),
      errorTypes,
      difficultyLevel: currentLevel,
      moodAfter: selectedMood || "calm",
      synced: false,
    };

    // DIRECT WRITE SEAM -> Push into Sanjit's Sync Queue!
    syncEngine.enqueue("game_session", session, true);
  };

  // Mood Selection Handler
  const handleMoodSelect = (mood: DementiaMood) => {
    setSelectedMood(mood);
  };

  // Reminder Ack Handler -> Push into Sanjit's Sync Queue
  const handleReminderAck = (rem: ScheduledReminder, status: "acknowledged" | "snoozed" | "missed") => {
    const ack = reminderAckEngine.createAck(patientId, rem.reminderType, status);
    syncEngine.enqueue("reminder_ack", ack, true);

    setRemindersFeed((prev) => [
      { id: rem.id, title: rem.title, status, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
                  SECTION 1: PRAVEEN
                </span>
                <span className="text-xs text-slate-400">Cognitive Therapy & Adaptive Difficulty Lab</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {t.cognitive.title}
              </h2>
            </div>
          </div>

          {/* Level & Dynamic Adaptation Pill */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-950 border border-purple-500/30 px-4 py-2 rounded-xl flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Level</span>
                <span className="text-sm font-bold text-purple-400">
                  Level {currentLevel}: {DIFFICULTY_LEVELS[currentLevel]?.name}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setCurrentLevel(lvl)}
                    className={`w-6 h-6 rounded-md font-mono text-xs font-bold transition-all ${
                      currentLevel === lvl
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setSelectedGame("memory")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedGame === "memory"
                ? "bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            <span className="text-xs font-bold block">1. Memory Card Matrix</span>
            <span className="text-[11px] text-slate-400">NER Cultural Artifacts (Bihu, Jaapi)</span>
          </button>

          <button
            onClick={() => setSelectedGame("attention")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedGame === "attention"
                ? "bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            <span className="text-xs font-bold block">2. Selective Attention</span>
            <span className="text-[11px] text-slate-400">Target Visual Pattern Search</span>
          </button>

          <button
            onClick={() => setSelectedGame("routine")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedGame === "routine"
                ? "bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            <span className="text-xs font-bold block">3. Daily Routine Recall</span>
            <span className="text-[11px] text-slate-400">Morning-to-Night Sequence</span>
          </button>

          <button
            onClick={() => setSelectedGame("pattern")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedGame === "pattern"
                ? "bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            <span className="text-xs font-bold block">4. Cultural Recognition</span>
            <span className="text-[11px] text-slate-400">Loktak & Living Root Bridges</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena (8 cols) & Clinical HUD (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Game Interactive Canvas */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between min-h-[460px]">
          {/* Game Top Bar: Timer, Score, Restart */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="font-mono font-bold text-slate-200 text-sm">{timerSeconds}s</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="font-mono font-bold text-amber-400 text-sm">{score} pts</span>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Game</span>
            </button>
          </div>

          {/* GAME 1 & 4: MEMORY / CULTURAL CARDS */}
          {(selectedGame === "memory" || selectedGame === "pattern") && (
            <div className="py-6">
              <p className="text-xs text-slate-400 mb-4 text-center">
                Tap cards to match pairs of North-East cultural artifacts and traditional icons.
              </p>
              <div
                className={`grid gap-3 max-w-lg mx-auto ${
                  cards.length <= 4
                    ? "grid-cols-2"
                    : cards.length <= 8
                    ? "grid-cols-4"
                    : "grid-cols-4 md:grid-cols-6"
                }`}
              >
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={card.isMatched || card.isFlipped}
                    className={`h-28 rounded-2xl border flex flex-col items-center justify-center p-2 transition-all duration-300 transform ${
                      card.isMatched
                        ? "bg-emerald-950/40 border-emerald-500/60 opacity-60 scale-95"
                        : card.isFlipped
                        ? "bg-purple-950/60 border-purple-400 scale-105 shadow-lg shadow-purple-500/20"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700 hover:scale-102"
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <>
                        <span className="text-3xl mb-1">{card.symbol}</span>
                        <span className="text-[10px] text-center font-bold text-slate-300 truncate w-full">
                          {card.name}
                        </span>
                      </>
                    ) : (
                      <Brain className="w-8 h-8 text-slate-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 2: ATTENTION TARGET SEARCH */}
          {selectedGame === "attention" && attentionChallenge && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-purple-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{attentionChallenge.target.icon}</span>
                  <div>
                    <span className="font-bold block">Find all: {attentionChallenge.target.name}</span>
                    <span className="text-slate-400">{attentionChallenge.target.hint}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm bg-purple-900/60 px-3 py-1 rounded-lg">
                  {foundTargets} / {attentionChallenge.targetCount} Found
                </span>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-w-xl mx-auto">
                {attentionChallenge.grid.map((item, idx) => (
                  <button
                    key={`att-${idx}`}
                    onClick={() => handleAttentionClick(item, idx)}
                    className="h-20 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-1 transition-all active:scale-95"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 3: DAILY ROUTINE RECALL */}
          {selectedGame === "routine" && (
            <div className="py-4 space-y-4">
              <p className="text-xs text-slate-400 text-center">
                Click steps in chronological morning-to-night order to organize Dharmananda's daily routine.
              </p>

              {/* Step Sequence Tray */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 min-h-[70px] flex items-center space-x-2 overflow-x-auto">
                {placedSteps.length === 0 ? (
                  <span className="text-xs text-slate-500 italic mx-auto">
                    Click available cards below in correct sequential order
                  </span>
                ) : (
                  placedSteps.map((st, idx) => (
                    <div
                      key={`placed-${st.id}`}
                      className="px-3 py-2 bg-purple-950/60 border border-purple-500/40 rounded-xl flex items-center space-x-2 flex-shrink-0"
                    >
                      <span className="font-mono text-xs font-bold text-purple-400">#{idx + 1}</span>
                      <span className="text-sm">{st.icon}</span>
                      <span className="text-xs font-semibold text-slate-200">{st.title}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Available Routine Options */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {routineChallenge.shuffled.map((step) => {
                  const isPlaced = placedSteps.some((p) => p.id === step.id);
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleRoutineStepClick(step)}
                      disabled={isPlaced}
                      className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                        isPlaced
                          ? "bg-slate-950 border-slate-800 opacity-40 cursor-not-allowed"
                          : "bg-slate-950 hover:bg-slate-850 border-slate-700 text-slate-200 hover:border-purple-500"
                      }`}
                    >
                      <span className="text-2xl">{step.icon}</span>
                      <div>
                        <span className="text-xs font-bold block">{step.title}</span>
                        <span className="text-[10px] text-purple-400 font-mono">{step.timeLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Game Completed & Seam Written Card */}
          {gameCompleted && (
            <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Session Complete & Queued to Sanjit's Engine</span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {accuracy}% Accuracy | {score} pts
                </span>
              </div>

              {lastAdaptation && (
                <p className="text-xs text-slate-300">
                  <strong>Adaptive Rule Feedback:</strong> {lastAdaptation.reason} ({lastAdaptation.recommendedCueing})
                </p>
              )}

              {/* 5-Tier Dementia Mood Check-In */}
              <div className="pt-2 border-t border-emerald-900/60">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  {t.cognitive.checkInMood}:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {DEMENTIA_MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedMood === mood.value
                          ? mood.color + " shadow-md scale-105"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      <span className="text-xl block">{mood.emoji}</span>
                      <span className="text-[10px] font-bold block truncate mt-1">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Reminders & Clinical Engine Rules (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Daily Reminders Simulator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                {t.cognitive.reminderTitle}
              </h4>
              <span className="text-xs text-slate-400 font-mono">Sync Queue Seam</span>
            </div>

            <div className="space-y-2.5">
              {activeReminders.map((rem) => (
                <div key={rem.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <span>{rem.icon}</span>
                      {rem.title}
                    </span>
                    <span className="font-mono text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                      {rem.timeStr}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{rem.instructions}</p>
                  <div className="flex items-center justify-end space-x-1.5 pt-1">
                    <button
                      onClick={() => handleReminderAck(rem, "missed")}
                      className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-[10px] rounded-lg transition-colors"
                    >
                      Missed
                    </button>
                    <button
                      onClick={() => handleReminderAck(rem, "snoozed")}
                      className="px-2 py-1 bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-300 text-[10px] rounded-lg transition-colors"
                    >
                      Snooze
                    </button>
                    <button
                      onClick={() => handleReminderAck(rem, "acknowledged")}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                    >
                      Take / Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adaptation Matrix Rules Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Dynamic Rule Matrix
            </h4>
            <div className="text-xs text-slate-300 space-y-2 font-mono">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-bold block">Level UP Condition:</span>
                Accuracy &gt; 85% & avgLatency &lt; 2500ms
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-rose-400 font-bold block">Level DOWN Condition:</span>
                Accuracy &lt; 50% OR Timeouts &gt; 1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
