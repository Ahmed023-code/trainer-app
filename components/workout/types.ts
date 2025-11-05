// components/workout/types.ts
export type SetType = "Working" | "Warmup" | "Superset" | "Drop Set";

export type ExerciseSource = "quick-add" | "routine";

export type SetItem = {
  weight: number;
  repsMin: number;   // For routines: min reps in target range. For quick-add: actual reps performed
  repsMax: number;   // For routines: max reps in target range. For quick-add: same as repsMin
  rpe: number;       // 0–10
  type: SetType;     // set classification
  repsPerformed?: number; // For routine exercises during workout: actual reps completed
  // legacy single reps (ignored by new UI but kept for migration)
  reps?: number;
};

export type Exercise = {
  name: string;
  sets: SetItem[];
  notes?: string; // exercise-level notes
  source?: ExerciseSource; // Track whether this was quick-added or from a routine
  routineId?: string; // If from routine, track which routine
};

export type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
  emoji?: string; // Optional emoji for routine visual identification
};