"use client";

import { create } from "zustand";

type Set = { reps: number; weight: number; done?: boolean };
type Exercise = { id: string; name: string; sets: Set[] };
type Program = { id: string; name: string; daysPerWeek: number };

type WorkoutState = {
  programs: Program[];
  today: Exercise[];
  addExerciseToToday: (name: string) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  programs: [{ id: uid(), name: "Push/Pull/Legs", daysPerWeek: 6 }],
  today: [],
  addExerciseToToday: (name) => {
    const ex: Exercise = { id: uid(), name, sets: [{ reps: 8, weight: 135 }, { reps: 8, weight: 145 }] };
    set({ today: [...get().today, ex] });
  },
  completeSet: (exerciseId, setIndex) => {
    const next = get().today.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const sets = ex.sets.map((s, i) => i === setIndex ? { ...s, done: !s.done } : s);
      return { ...ex, sets };
    });
    set({ today: next });
  }
}));
