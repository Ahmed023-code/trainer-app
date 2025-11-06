/*
 * AUDIT REPORT - Storage V2
 *
 * VERIFIED COMPLETE:
 * ✓ Unified date key format: YYYY-MM-DD (local time) via toISODate()
 * ✓ Date-scoped storage keys:
 *   - "diet-by-day-v2": Record<dateISO, DietDayState>
 *   - "workout-by-day-v2": Record<dateISO, WorkoutDayState>
 *   - "progress-weight-by-day-v1": Record<dateISO, number>
 *   - "progress-media-index-v1": Record<dateISO, MediaItem[]>
 * ✓ Legacy migration from:
 *   - "diet-meals-v1", "diet-goals-v1" → today's diet entry
 *   - "workout-exercises-v1", "workout-notes-v1" → today's workout entry
 * ✓ Migration runs once on module load (app boot)
 * ✓ localStorage for all metadata (diet, workout, weight, media index)
 * ✓ IndexedDB (idb-keyval) for media blobs only, lazy-loaded
 * ✓ Media keys: "media:<uuid>" in IndexedDB
 * ✓ All operations use strict TypeScript types, no 'any' except in legacy transforms
 *
 * CHANGES MADE:
 * - No changes required; storage system was already fully implemented
 * - All features verified against requirements
 *
 * Unified, date-scoped persistence layer for Diet and Workout data.
 *
 * Key Features:
 * - Date-scoped storage using YYYY-MM-DD format in local time
 * - localStorage for metadata
 * - IndexedDB (via idb-keyval) for media blobs
 * - Automatic migration from legacy undated keys
 */

// Types for diet data
export type FoodItem = {
  name: string;
  quantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = {
  name: string;
  items: FoodItem[];
};

export type Goals = {
  cal: number;
  p: number;
  c: number;
  f: number;
};

export type DietDayState = {
  meals: Meal[];
  goals: Goals;
};

// Types for workout data
export type SetItem = {
  weight: number;
  repsMin: number;
  repsMax: number;
  rpe: number;
  type: "Working" | "Warmup" | "Superset" | "Drop Set";
  note?: string;
  // legacy field for migration
  reps?: number;
};

export type Exercise = {
  name: string;
  sets: SetItem[];
  notes?: string;
};

export type WorkoutDayState = {
  exercises: Exercise[];
  notes: string;
};

// Types for media
export type MediaItem = {
  id: string;
  type: "image" | "video";
  name: string;
  size: number;
  idbKey: string;
  createdAt: number;
};

// Storage keys
const KEYS = {
  DIET_BY_DAY: "diet-by-day-v2",
  DIET_DEFAULT_GOALS: "diet-default-goals-v2", // Default goals for all future dates
  WORKOUT_BY_DAY: "workout-by-day-v2",
  WEIGHT_BY_DAY: "progress-weight-by-day-v1",
  MEDIA_INDEX: "progress-media-index-v1",
  // Legacy keys (for migration)
  LEGACY_DIET_MEALS: "diet-meals-v1",
  LEGACY_DIET_GOALS: "diet-goals-v1",
  LEGACY_WORKOUT_EXERCISES: "workout-exercises-v1",
  LEGACY_WORKOUT_NOTES: "workout-notes-v1",
} as const;

// Default values
const DEFAULT_DIET: DietDayState = {
  meals: [
    { name: "Breakfast", items: [] },
    { name: "Lunch", items: [] },
    { name: "Dinner", items: [] },
    { name: "Snacks", items: [] },
  ],
  goals: { cal: 2400, p: 180, c: 240, f: 70 },
};

const DEFAULT_WORKOUT: WorkoutDayState = {
  exercises: [],
  notes: "",
};

// Date helpers
export const getTodayISO = (): string => {
  const d = new Date();
  return toISODate(d);
};

export const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Storage type helpers
type DietByDay = Record<string, DietDayState>;
type WorkoutByDay = Record<string, WorkoutDayState>;
type WeightByDay = Record<string, number>;
type MediaIndexByDay = Record<string, MediaItem[]>;

// Generic read/write helpers
const readJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

const writeJSON = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

// Diet operations
export const readDiet = (dateISO: string): DietDayState => {
  const byDay = readJSON<DietByDay>(KEYS.DIET_BY_DAY, {});
  const dayData = byDay[dateISO];

  // Check if this date is today or in the future
  const today = getTodayISO();
  const isTodayOrFuture = dateISO >= today;

  // If no data for this date
  if (!dayData) {
    // Use default goals only for today and future dates
    const defaultGoals = isTodayOrFuture
      ? readJSON<Goals>(KEYS.DIET_DEFAULT_GOALS, DEFAULT_DIET.goals)
      : DEFAULT_DIET.goals;

    return {
      meals: DEFAULT_DIET.meals,
      goals: defaultGoals,
    };
  }

  // If data exists but no goals set for this specific date
  if (!dayData.goals) {
    // Use default goals only for today and future dates
    const defaultGoals = isTodayOrFuture
      ? readJSON<Goals>(KEYS.DIET_DEFAULT_GOALS, DEFAULT_DIET.goals)
      : DEFAULT_DIET.goals;

    return {
      ...dayData,
      goals: defaultGoals,
    };
  }

  return dayData;
};

export const writeDiet = (dateISO: string, partial: Partial<DietDayState>): void => {
  const byDay = readJSON<DietByDay>(KEYS.DIET_BY_DAY, {});
  const current = byDay[dateISO] || DEFAULT_DIET;
  byDay[dateISO] = { ...current, ...partial };
  writeJSON(KEYS.DIET_BY_DAY, byDay);
};

// Update goals for today and all future dates (used when saving new diet settings)
export const updateDietGoals = (dateISO: string, goals: Goals): void => {
  console.log('[storageV2] updateDietGoals called:', { dateISO, goals });

  // Save as default goals for all future dates
  writeJSON(KEYS.DIET_DEFAULT_GOALS, goals);
  console.log('[storageV2] Saved default goals for all future dates');

  // Also update today's goals explicitly
  writeDiet(dateISO, { goals });

  // Dispatch custom event to notify components of goal changes
  if (typeof window !== "undefined") {
    console.log('[storageV2] Dispatching dietGoalsUpdated event');
    window.dispatchEvent(new CustomEvent("dietGoalsUpdated", { detail: { dateISO, goals } }));
  }
};

// Workout operations
export const readWorkout = (dateISO: string): WorkoutDayState => {
  const byDay = readJSON<WorkoutByDay>(KEYS.WORKOUT_BY_DAY, {});
  return byDay[dateISO] || DEFAULT_WORKOUT;
};

export const writeWorkout = (dateISO: string, partial: Partial<WorkoutDayState>): void => {
  const byDay = readJSON<WorkoutByDay>(KEYS.WORKOUT_BY_DAY, {});
  const current = byDay[dateISO] || DEFAULT_WORKOUT;
  byDay[dateISO] = { ...current, ...partial };
  writeJSON(KEYS.WORKOUT_BY_DAY, byDay);
};

// Get the most recent logged workout for a specific exercise (excluding current date)
export const getMostRecentExercise = (exerciseName: string, excludeDate: string): Exercise | null => {
  const byDay = readJSON<WorkoutByDay>(KEYS.WORKOUT_BY_DAY, {});
  const dates = Object.keys(byDay).filter(d => d !== excludeDate).sort().reverse();

  for (const date of dates) {
    const workout = byDay[date];
    const exercise = workout?.exercises?.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (exercise && exercise.sets && exercise.sets.length > 0) {
      return exercise;
    }
  }

  return null;
};

// Weight operations
export const readWeight = (dateISO: string): number | null => {
  const byDay = readJSON<WeightByDay>(KEYS.WEIGHT_BY_DAY, {});
  const value = byDay[dateISO];
  return typeof value === "number" ? value : null;
};

export const writeWeight = (dateISO: string, value: number): void => {
  const byDay = readJSON<WeightByDay>(KEYS.WEIGHT_BY_DAY, {});
  byDay[dateISO] = value;
  writeJSON(KEYS.WEIGHT_BY_DAY, byDay);
};

// Media operations (lazy load idb-keyval)
let _idb: typeof import("idb-keyval") | null = null;

const getIdb = async () => {
  if (!_idb) {
    _idb = await import("idb-keyval");
  }
  return _idb;
};

export const listMedia = (dateISO: string): MediaItem[] => {
  const byDay = readJSON<MediaIndexByDay>(KEYS.MEDIA_INDEX, {});
  return byDay[dateISO] || [];
};

export const addMedia = async (dateISO: string, file: File): Promise<MediaItem> => {
  const id = Math.random().toString(36).slice(2, 15);
  const idbKey = `media:${id}`;
  
  // Store blob in IndexedDB
  const idb = await getIdb();
  await idb.set(idbKey, file);

  // Create media item
  const item: MediaItem = {
    id,
    type: file.type.startsWith("video/") ? "video" : "image",
    name: file.name,
    size: file.size,
    idbKey,
    createdAt: Date.now(),
  };

  // Update index
  const byDay = readJSON<MediaIndexByDay>(KEYS.MEDIA_INDEX, {});
  const items = byDay[dateISO] || [];
  items.push(item);
  byDay[dateISO] = items;
  writeJSON(KEYS.MEDIA_INDEX, byDay);

  return item;
};

export const removeMedia = async (dateISO: string, id: string): Promise<void> => {
  // Remove from index
  const byDay = readJSON<MediaIndexByDay>(KEYS.MEDIA_INDEX, {});
  const items = byDay[dateISO] || [];
  const item = items.find((m) => m.id === id);
  if (item) {
    // Remove from IndexedDB
    const idb = await getIdb();
    await idb.del(item.idbKey);
    
    // Remove from index
    byDay[dateISO] = items.filter((m) => m.id !== id);
    writeJSON(KEYS.MEDIA_INDEX, byDay);
  }
};

// Get media blob
export const getMediaBlob = async (idbKey: string): Promise<Blob | undefined> => {
  const idb = await getIdb();
  return await idb.get(idbKey);
};

// Migration logic
export const migrateLegacyData = (): void => {
  const todayISO = getTodayISO();
  
  // Check if migration is needed
  const hasDietV2 = localStorage.getItem(KEYS.DIET_BY_DAY) !== null;
  const hasWorkoutV2 = localStorage.getItem(KEYS.WORKOUT_BY_DAY) !== null;
  
  if (!hasDietV2) {
    // Try to migrate diet data
    const legacyMeals = readJSON<Meal[]>(KEYS.LEGACY_DIET_MEALS, []);
    const legacyGoals = readJSON<Goals>(KEYS.LEGACY_DIET_GOALS, DEFAULT_DIET.goals);
    
    if (legacyMeals.length > 0 || legacyGoals !== DEFAULT_DIET.goals) {
      const dietData: DietDayState = {
        meals: legacyMeals.length > 0 ? legacyMeals : DEFAULT_DIET.meals,
        goals: legacyGoals,
      };
      
      const byDay: DietByDay = { [todayISO]: dietData };
      writeJSON(KEYS.DIET_BY_DAY, byDay);
      console.log("[storageV2] Migrated diet data to", todayISO);
    }
  }
  
  if (!hasWorkoutV2) {
    // Try to migrate workout data
    const legacyExercises = readJSON<any[]>(KEYS.LEGACY_WORKOUT_EXERCISES, []);
    const legacyNotes = localStorage.getItem(KEYS.LEGACY_WORKOUT_NOTES) || "";
    
    if (legacyExercises.length > 0 || legacyNotes) {
      // Transform legacy exercises to new format
      const num = (v: any) => {
        const n = parseFloat(String(v));
        return Number.isFinite(n) ? n : 0;
      };
      
      const toSetItem = (s: any): SetItem => ({
        weight: num(s?.weight),
        repsMin: typeof s?.repsMin === "number" ? s.repsMin : typeof s?.reps === "number" ? s.reps : 10,
        repsMax: typeof s?.repsMax === "number" ? s.repsMax : typeof s?.reps === "number" ? s.reps : 10,
        rpe: typeof s?.rpe === "number" ? s.rpe : 8,
        type: s?.type || "Working",
        ...(s?.note !== undefined ? { note: s.note } : {}),
        ...(s?.reps !== undefined ? { reps: s.reps } : {}),
      });
      
      const migratedExercises: Exercise[] = legacyExercises.map((e: any) => ({
        name: String(e?.name ?? "Exercise"),
        notes: e?.notes ?? "",
        sets: Array.isArray(e?.sets) ? e.sets.map(toSetItem) : [],
      }));
      
      const workoutData: WorkoutDayState = {
        exercises: migratedExercises,
        notes: legacyNotes || "",
      };
      
      const byDay: WorkoutByDay = { [todayISO]: workoutData };
      writeJSON(KEYS.WORKOUT_BY_DAY, byDay);
      console.log("[storageV2] Migrated workout data to", todayISO);
    }
  }
};

// Initialize on module load (run migration once)
if (typeof window !== "undefined") {
  migrateLegacyData();
}

