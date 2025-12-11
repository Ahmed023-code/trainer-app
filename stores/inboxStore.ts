// CHANGE: New inbox store for reminders, messages, and alerts
import { create } from "zustand";

export type Reminder = {
  id: string;
  title: string;
  dueISO?: string;
  done: boolean;
};

export type Message = {
  id: string;
  from: string;
  text: string;
  createdAt: number;
};

export type Alert = {
  id: string;
  type: "info" | "warn" | "error";
  text: string;
  createdAt: number;
};

type InboxState = {
  reminders: Reminder[];
  messages: Message[];
  alerts: Alert[];

  addReminder: (title: string, dueISO?: string) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;

  addMessage: (from: string, text: string) => void;
  removeMessage: (id: string) => void;

  addAlert: (type: Alert["type"], text: string) => void;
  removeAlert: (id: string) => void;

  loadFromStorage: () => void;
  saveToStorage: () => void;
};

const STORAGE_KEY = "inbox-v1";

const MOCK_REMINDERS: Reminder[] = [
  { id: "rem-1", title: "Grocery run for meal prep", dueISO: "2024-04-06", done: false },
  { id: "rem-2", title: "Refill water bottle", done: true },
  { id: "rem-3", title: "Evening mobility flow", done: false },
];

const MOCK_MESSAGES: Message[] = [
  { id: "msg-1", from: "Coach", text: "Keep protein above 180g today!", createdAt: Date.now() - 1000 * 60 * 60 },
];

const MOCK_ALERTS: Alert[] = [
  { id: "al-1", type: "info", text: "Demo mode — interactions are disabled.", createdAt: Date.now() - 1000 * 60 * 30 },
];

export const useInboxStore = create<InboxState>((set, get) => ({
  reminders: MOCK_REMINDERS,
  messages: MOCK_MESSAGES,
  alerts: MOCK_ALERTS,

  addReminder: (title, dueISO) => {
    console.info("[demo] addReminder ignored", { title, dueISO });
  },

  toggleReminder: (id) => {
    console.info("[demo] toggleReminder ignored", { id });
  },

  removeReminder: (id) => {
    console.info("[demo] removeReminder ignored", { id });
  },

  addMessage: (from, text) => {
    console.info("[demo] addMessage ignored", { from, text });
  },

  removeMessage: (id) => {
    console.info("[demo] removeMessage ignored", { id });
  },

  addAlert: (type, text) => {
    console.info("[demo] addAlert ignored", { type, text });
  },

  removeAlert: (id) => {
    console.info("[demo] removeAlert ignored", { id });
  },

  loadFromStorage: () => {
    set({ reminders: MOCK_REMINDERS, messages: MOCK_MESSAGES, alerts: MOCK_ALERTS });
  },

  saveToStorage: () => {
    // no-op in demo mode
  },
}));

// Load on module init
if (typeof window !== "undefined") {
  useInboxStore.getState().loadFromStorage();
}
