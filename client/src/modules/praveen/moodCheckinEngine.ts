export type DementiaMood = "happy" | "calm" | "neutral" | "confused" | "anxious";

export interface MoodOption {
  value: DementiaMood;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

export const DEMENTIA_MOOD_OPTIONS: MoodOption[] = [
  { value: "happy", emoji: "😊", label: "Happy & Energetic", color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40", description: "Engaged, smiling, high cognitive spirits" },
  { value: "calm", emoji: "😌", label: "Calm & Content", color: "text-blue-400 border-blue-500/40 bg-blue-950/40", description: "Peaceful, receptive, steady breathing" },
  { value: "neutral", emoji: "😐", label: "Neutral / Quiet", color: "text-slate-400 border-slate-500/40 bg-slate-900/40", description: "Passive, observant, neutral gaze" },
  { value: "confused", emoji: "😕", label: "Perplexed / Hesitant", color: "text-amber-400 border-amber-500/40 bg-amber-950/40", description: "Searching for cues, asking repeated questions" },
  { value: "anxious", emoji: "😰", label: "Restless / Anxious", color: "text-rose-400 border-rose-500/40 bg-rose-950/40", description: "Agitated, sundowning tendencies, pacing" },
];
