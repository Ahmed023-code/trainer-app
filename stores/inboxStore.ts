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

export const useInboxStore = create<InboxState>((set, get) => ({
  reminders: [],
  messages: [],
  alerts: [],

  addReminder: (title, dueISO) => {
    const reminder: Reminder = {
      id: Math.random().toString(36).slice(2, 11),
      title,
      dueISO,
      done: false,
    };
    set((state) => ({ reminders: [...state.reminders, reminder] }));
    get().saveToStorage();
  },

  toggleReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, done: !r.done } : r
      ),
    }));
    get().saveToStorage();
  },

  removeReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));
    get().saveToStorage();
  },

  addMessage: (from, text) => {
    const message: Message = {
      id: Math.random().toString(36).slice(2, 11),
      from,
      text,
      createdAt: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, message] }));
    get().saveToStorage();
  },

  removeMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
    get().saveToStorage();
  },

  addAlert: (type, text) => {
    const alert: Alert = {
      id: Math.random().toString(36).slice(2, 11),
      type,
      text,
      createdAt: Date.now(),
    };
    set((state) => ({ alerts: [...state.alerts, alert] }));
    get().saveToStorage();
  },

  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }));
    get().saveToStorage();
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          reminders: data.reminders || [],
          messages: data.messages || [],
          alerts: data.alerts || [],
        });
      }
    } catch (err) {
      console.error("[inboxStore] Failed to load from storage", err);
    }
  },

  saveToStorage: () => {
    if (typeof window === "undefined") return;

    try {
      const { reminders, messages, alerts } = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ reminders, messages, alerts })
      );
    } catch (err) {
      console.error("[inboxStore] Failed to save to storage", err);
    }
  },
}));

// Load on module init
if (typeof window !== "undefined") {
  useInboxStore.getState().loadFromStorage();
}
