// components/workout/types.ts
export type SetType = "Working" | "Warmup" | "Superset" | "Drop Set";

export type SetItem = {
  weight: number;
  repsMin: number;   // required
  repsMax: number;   // required
  rpe: number;       // 0–10
  type: SetType;     // set classification
  // legacy single reps (ignored by new UI but kept for migration)
  reps?: number;
};

export type Exercise = {
  name: string;
  sets: SetItem[];
  notes?: string; // exercise-level notes
};

export type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
};