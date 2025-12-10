import { create } from "zustand";

const STORAGE_KEY = "reminders-v1";

export type Reminder = {
  id: string;
  title: string;
  timeISO?: string; // ISO time string for when reminder should fire
  repeat: "none" | "daily" | "weekly";
  enabled: boolean;
  createdAt: number;
};

type NotificationsState = {
  reminders: Reminder[];
  permissionStatus: NotificationPermission | "default";

  // Reminder CRUD
  addReminder: (title: string, timeISO?: string, repeat?: "none" | "daily" | "weekly") => Reminder;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;

  // Permissions
  requestPermission: () => Promise<boolean>;
  checkPermission: () => void;

  // Storage
  loadFromStorage: () => void;
  saveToStorage: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  reminders: [],
  permissionStatus: "default",

  addReminder: (title, timeISO, repeat = "none") => {
    const reminder: Reminder = {
      id: Math.random().toString(36).slice(2, 11),
      title,
      timeISO,
      repeat,
      enabled: true,
      createdAt: Date.now(),
    };

    set((state) => ({
      reminders: [...state.reminders, reminder],
    }));

    get().saveToStorage();
    return reminder;
  },

  updateReminder: (id, updates) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, ...updates } : r
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

  toggleReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
    get().saveToStorage();
  },

  requestPermission: async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      set({ permissionStatus: permission });
      return permission === "granted";
    } catch {
      return false;
    }
  },

  checkPermission: () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      set({ permissionStatus: "default" });
      return;
    }

    set({ permissionStatus: Notification.permission });
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (Array.isArray(data.reminders)) {
        set({ reminders: data.reminders });
      }
    } catch {
      // Ignore errors
    }
  },

  saveToStorage: () => {
    try {
      const { reminders } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ reminders }));
    } catch {
      // Ignore errors
    }
  },
}));

// Load from storage and check permissions on mount
if (typeof window !== "undefined") {
  useNotificationsStore.getState().loadFromStorage();
  useNotificationsStore.getState().checkPermission();
}

// Helper to schedule notifications (simplified)
export const scheduleNotification = (reminder: Reminder) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted" || !reminder.enabled || !reminder.timeISO) {
    return;
  }

  // Parse time
  const [hours, minutes] = reminder.timeISO.split(":").map(Number);
  const now = new Date();
  const targetTime = new Date(now);
  targetTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow (for daily) or don't schedule (for none)
  if (targetTime < now) {
    if (reminder.repeat === "daily") {
      targetTime.setDate(targetTime.getDate() + 1);
    } else if (reminder.repeat === "weekly") {
      targetTime.setDate(targetTime.getDate() + 7);
    } else {
      return; // Don't schedule one-time past reminders
    }
  }

  const delay = targetTime.getTime() - now.getTime();

  // Use setTimeout for simple scheduling (note: this won't persist across page reloads)
  setTimeout(() => {
    new Notification(reminder.title, {
      body: "Time for your reminder!",
      icon: "/icon-192x192.png",
    });

    // Reschedule if repeat is enabled
    if (reminder.repeat === "daily") {
      targetTime.setDate(targetTime.getDate() + 1);
      scheduleNotification(reminder);
    } else if (reminder.repeat === "weekly") {
      targetTime.setDate(targetTime.getDate() + 7);
      scheduleNotification(reminder);
    }
  }, delay);
};
