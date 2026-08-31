import { ReminderAck, ReminderType, ReminderStatus } from "../../shared/contract";

export interface ScheduledReminder {
  id: string;
  patientId: string;
  reminderType: ReminderType;
  title: string;
  timeStr: string;
  instructions: string;
  icon: string;
}

export const PRESET_REMINDERS: ScheduledReminder[] = [
  {
    id: "rem-1",
    patientId: "patient-101",
    reminderType: "medicine",
    title: "Donepezil 10mg Morning Pill",
    timeStr: "08:00 AM",
    instructions: "Take with half a glass of warm water after breakfast.",
    icon: "💊",
  },
  {
    id: "rem-2",
    patientId: "patient-101",
    reminderType: "hydration",
    title: "Mid-Day Hydration - Fresh Coconut Water",
    timeStr: "11:30 AM",
    instructions: "Drink a full glass of water or fresh tender coconut.",
    icon: "💧",
  },
  {
    id: "rem-3",
    patientId: "patient-101",
    reminderType: "activity",
    title: "Light Stretching & Garden Walk",
    timeStr: "04:30 PM",
    instructions: "Walk 15 minutes along the botanical garden corridor.",
    icon: "🚶",
  },
  {
    id: "rem-4",
    patientId: "patient-101",
    reminderType: "medicine",
    title: "Memantine 5mg Evening Dose",
    timeStr: "08:00 PM",
    instructions: "Take before dinner.",
    icon: "💊",
  },
];

export class ReminderAckEngine {
  public createAck(
    patientId: string,
    reminderType: ReminderType,
    status: ReminderStatus,
    scheduledAt: string = new Date().toISOString()
  ): ReminderAck {
    return {
      id: `rem-ack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      reminderType,
      scheduledAt,
      ackedAt: status === "acknowledged" ? new Date().toISOString() : null,
      status,
      synced: false,
    };
  }
}

export const reminderAckEngine = new ReminderAckEngine();
