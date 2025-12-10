import { create } from "zustand";

const STORAGE_KEY = "workout-goals-v1";

type WorkoutSplit = "ppl" | "upperLower" | "fullBody" | "bodyPart" | "custom";
type WorkoutFocus = "strength" | "hypertrophy" | "endurance" | "mixed";

type WorkoutGoals = {
  sessionsPerWeek: number;
  split: WorkoutSplit;
  targetDurationMin: number;
  focus: WorkoutFocus;
};

type WorkoutGoalsState = WorkoutGoals & {
  setSessionsPerWeek: (sessions: number) => void;
  setSplit: (split: WorkoutSplit) => void;
  setTargetDuration: (minutes: number) => void;
  setFocus: (focus: WorkoutFocus) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
};

const DEFAULT_GOALS: WorkoutGoals = {
  sessionsPerWeek: 4,
  split: "ppl",
  targetDurationMin: 60,
  focus: "hypertrophy",
};

export const useWorkoutGoalsStore = create<WorkoutGoalsState>((set, get) => ({
  ...DEFAULT_GOALS,

  setSessionsPerWeek: (sessionsPerWeek) => {
    set({ sessionsPerWeek });
    get().saveToStorage();
  },

  setSplit: (split) => {
    set({ split });
    get().saveToStorage();
  },

  setTargetDuration: (targetDurationMin) => {
    set({ targetDurationMin });
    get().saveToStorage();
  },

  setFocus: (focus) => {
    set({ focus });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      set({ ...DEFAULT_GOALS, ...data });
    } catch {
      // Ignore errors
    }
  },

  saveToStorage: () => {
    try {
      const { sessionsPerWeek, split, targetDurationMin, focus } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionsPerWeek, split, targetDurationMin, focus }));
    } catch {
      // Ignore errors
    }
  },
}));

// Load from storage on mount
if (typeof window !== "undefined") {
  useWorkoutGoalsStore.getState().loadFromStorage();
}

export type { WorkoutSplit, WorkoutFocus };
