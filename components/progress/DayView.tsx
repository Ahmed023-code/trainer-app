"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readDiet, readWorkout, readWeight, writeWeight, listMedia, addMedia, removeMedia, getMediaBlob } from "@/stores/storageV2";
import MacroRings from "@/components/diet/MacroRings";
import type { MediaItem } from "@/stores/storageV2";

// Load exercises data
let exercisesData: Array<{ name: string; bodyParts: string[] }> = [];
if (typeof window !== "undefined") {
  fetch("/data/exercises.json")
    .then(res => res.json())
    .then(data => { exercisesData = data; })
    .catch(() => {});
}

// Get body parts for an exercise name
function getBodyPartsForExercise(exerciseName: string): string[] {
  const exercise = exercisesData.find(e => e.name === exerciseName);
  return exercise?.bodyParts || [];
}

// Aggregate body parts from workout
function getWorkoutBodyParts(exerciseNames: string[]): string {
  const bodyPartsSet = new Set<string>();
  exerciseNames.forEach(name => {
    getBodyPartsForExercise(name).forEach(bp => bodyPartsSet.add(bp));
  });

  const bodyParts = Array.from(bodyPartsSet);
  if (bodyParts.length === 0) return "";
  if (bodyParts.length <= 2) return bodyParts.join(" & ");
  return bodyParts.slice(0, 2).join(", ") + ` +${bodyParts.length - 2}`;
}

interface DayViewProps {
  dateISO: string;
  isToday: boolean;
}

export default function DayView({ dateISO, isToday }: DayViewProps) {
  const router = useRouter();

  // Weight state
  const [weightValue, setWeightValue] = useState<string>("");
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [savedWeight, setSavedWeight] = useState<number | null>(null);

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  // Diet/workout data
  const [dietSummary, setDietSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, goals: { cal: 2400, p: 180, c: 240, f: 70 } });
  const [workoutSummary, setWorkoutSummary] = useState({ exerciseCount: 0, setCount: 0, exerciseNames: [] as string[] });

  // Load data for selected date
  useEffect(() => {
    const loadData = () => {
      // Load weight
      const weight = readWeight(dateISO);
      setSavedWeight(weight);
      setWeightValue(weight !== null ? weight.toFixed(1) : "");

      // Load weight history (last 7 days)
      const history: number[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(dateISO);
        d.setDate(d.getDate() - i);
        const w = readWeight(d.toISOString().split("T")[0]);
        if (w !== null) history.push(w);
      }
      setWeightHistory(history.reverse());

      // Load diet summary
      const diet = readDiet(dateISO);
      const totals = diet.meals.reduce((acc, meal) => {
        return meal.items.reduce((sum, item) => ({
          calories: sum.calories + (item.calories * (item.quantity || 1)),
          protein: sum.protein + (item.protein * (item.quantity || 1)),
          carbs: sum.carbs + (item.carbs * (item.quantity || 1)),
          fat: sum.fat + (item.fat * (item.quantity || 1)),
        }), acc);
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      setDietSummary({ ...totals, goals: diet.goals });

      // Load workout summary
      const workout = readWorkout(dateISO);
      const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.type === "Working" || s.type === "Drop Set").length, 0);

      setWorkoutSummary({
        exerciseCount: workout.exercises.length,
        setCount,
        exerciseNames: workout.exercises.map(ex => ex.name),
      });

      // Load media
      const media = listMedia(dateISO);
      setMediaItems(media);

      // Load media URLs
      const loadMediaUrls = async () => {
        const urls: Record<string, string> = {};
        for (const item of media) {
          try {
            const blob = await getMediaBlob(item.idbKey);
            if (blob) {
              urls[item.id] = URL.createObjectURL(blob);
            }
          } catch (err) {
            console.error("Failed to load media", item.id, err);
          }
        }
        setMediaUrls(urls);
      };
      loadMediaUrls();
    };

    loadData();

    // Reload diet goals when page becomes visible or storage changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const diet = readDiet(dateISO);
        const totals = diet.meals.reduce((acc, meal) => {
          return meal.items.reduce((sum, item) => ({
            calories: sum.calories + (item.calories * (item.quantity || 1)),
            protein: sum.protein + (item.protein * (item.quantity || 1)),
            carbs: sum.carbs + (item.carbs * (item.quantity || 1)),
            fat: sum.fat + (item.fat * (item.quantity || 1)),
          }), acc);
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setDietSummary({ ...totals, goals: diet.goals });
      }
    };

    const handleFocus = () => {
      const diet = readDiet(dateISO);
      const totals = diet.meals.reduce((acc, meal) => {
        return meal.items.reduce((sum, item) => ({
          calories: sum.calories + (item.calories * (item.quantity || 1)),
          protein: sum.protein + (item.protein * (item.quantity || 1)),
          carbs: sum.carbs + (item.carbs * (item.quantity || 1)),
          fat: sum.fat + (item.fat * (item.quantity || 1)),
        }), acc);
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      setDietSummary({ ...totals, goals: diet.goals });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "diet-by-day-v2" || e.key === null) {
        const diet = readDiet(dateISO);
        const totals = diet.meals.reduce((acc, meal) => {
          return meal.items.reduce((sum, item) => ({
            calories: sum.calories + (item.calories * (item.quantity || 1)),
            protein: sum.protein + (item.protein * (item.quantity || 1)),
            carbs: sum.carbs + (item.carbs * (item.quantity || 1)),
            fat: sum.fat + (item.fat * (item.quantity || 1)),
          }), acc);
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setDietSummary({ ...totals, goals: diet.goals });
      }
    };

    // Custom event from updateDietGoals (same tab/window updates)
    const handleDietGoalsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.dateISO === dateISO) {
        const diet = readDiet(dateISO);
        const totals = diet.meals.reduce((acc, meal) => {
          return meal.items.reduce((sum, item) => ({
            calories: sum.calories + (item.calories * (item.quantity || 1)),
            protein: sum.protein + (item.protein * (item.quantity || 1)),
            carbs: sum.carbs + (item.carbs * (item.quantity || 1)),
            fat: sum.fat + (item.fat * (item.quantity || 1)),
          }), acc);
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setDietSummary({ ...totals, goals: diet.goals });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("dietGoalsUpdated", handleDietGoalsUpdated);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("dietGoalsUpdated", handleDietGoalsUpdated);
    };
  }, [dateISO]);

  // Cleanup media URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [mediaUrls]);

  // Save weight
  const saveWeight = () => {
    const value = parseFloat(weightValue);
    if (!isNaN(value) && value > 0) {
      writeWeight(dateISO, value);
      setSavedWeight(value);
      setWeightValue(value.toFixed(1));
    }
  };

  // Add media
  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const item = await addMedia(dateISO, file);
      setMediaItems(prev => [...prev, item]);

      // Load URL
      const blob = await getMediaBlob(item.idbKey);
      if (blob) {
        setMediaUrls(prev => ({ ...prev, [item.id]: URL.createObjectURL(blob) }));
      }
    } catch (err) {
      console.error("Failed to add media", err);
    }
  };

  // Delete media
  const handleDeleteMedia = async (item: MediaItem) => {
    try {
      await removeMedia(dateISO, item.id);
      setMediaItems(prev => prev.filter(m => m.id !== item.id));
      if (mediaUrls[item.id]) {
        URL.revokeObjectURL(mediaUrls[item.id]);
        setMediaUrls(prev => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to delete media", err);
    }
  };

  // Navigate to diet/workout with date
  const openDietForDate = () => {
    localStorage.setItem("ui-last-date-diet", dateISO);
    router.push(`/diet`);
  };

  const openWorkoutForDate = () => {
    localStorage.setItem("ui-last-date-workout", dateISO);
    router.push(`/workout`);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Weight card */}
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-3 shadow-sm">
          <label className="block text-sm font-medium mb-2">Weight</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="decimal"
              value={weightValue}
              onChange={(e) => {
                setWeightValue(e.target.value);
                // Allow editing by resetting saved state when value changes
                const newValue = parseFloat(e.target.value);
                if (savedWeight !== null && !isNaN(newValue) && newValue !== savedWeight) {
                  setSavedWeight(null);
                }
              }}
              placeholder="0.0"
              className="flex-1 rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 bg-white dark:bg-neutral-900 text-sm"
            />
            {savedWeight === null || parseFloat(weightValue) !== savedWeight ? (
              <button
                onClick={saveWeight}
                className="px-3 py-1.5 rounded-full bg-accent-progress text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-green-600 dark:text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>

          {/* Mini sparkline */}
          {weightHistory.length > 1 && (
            <div className="mt-2 flex items-end gap-1 h-12">
              {weightHistory.map((w, i) => {
                const max = Math.max(...weightHistory);
                const height = (w / max) * 100;
                return (
                  <div key={i} className="flex-1 bg-accent-progress/30 rounded-t" style={{ height: `${height}%` }} />
                );
              })}
            </div>
          )}
        </div>

        {/* Diet summary */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Diet Summary</h2>
            <button
              onClick={openDietForDate}
              className="tap-target px-3 py-1.5 rounded-full bg-accent-diet text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Open Diet
            </button>
          </div>
          <div className="flex justify-center overflow-hidden">
            <div className="w-full max-w-full">
              <MacroRings
                calories={{ label: "Cal", color: "var(--accent-diet)", current: Math.round(dietSummary.calories), target: dietSummary.goals.cal }}
                protein={{ label: "P", color: "#F87171", current: Math.round(dietSummary.protein), target: dietSummary.goals.p }}
                fat={{ label: "F", color: "var(--accent-diet-fat)", current: Math.round(dietSummary.fat), target: dietSummary.goals.f }}
                carbs={{ label: "C", color: "#60A5FA", current: Math.round(dietSummary.carbs), target: dietSummary.goals.c }}
                onMenuClick={() => router.push(`/settings/diet?returnDate=${dateISO}`)}
              />
            </div>
          </div>
        </div>

        {/* Workout summary */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Workout Summary</h2>
            <button
              onClick={openWorkoutForDate}
              className="tap-target px-3 py-1.5 rounded-full bg-[var(--accent-workout)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Open Workout
            </button>
          </div>
          {workoutSummary.exerciseCount > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-center mb-3">
                <div>
                  <div className="text-2xl font-bold">{workoutSummary.exerciseCount}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Exercises</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{workoutSummary.setCount}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">Sets</div>
                </div>
              </div>
              {(() => {
                const bodyParts = getWorkoutBodyParts(workoutSummary.exerciseNames);
                return bodyParts ? (
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Body Parts</div>
                    <div className="text-sm font-medium">{bodyParts}</div>
                  </div>
                ) : null;
              })()}
            </>
          ) : (
            <div className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400">
              No workout logged
            </div>
          )}
        </div>

        {/* Media gallery */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <h2 className="font-medium mb-3">Media</h2>
          <div className="grid grid-cols-3 gap-2">
            {mediaItems.map(item => (
              <div key={item.id} className="relative aspect-square">
                <img
                  src={mediaUrls[item.id] || ""}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-xl"
                  onClick={() => setPreviewMedia(item)}
                />
                <button
                  onClick={() => handleDeleteMedia(item)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="aspect-square border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleAddMedia}
              />
              <span className="text-2xl">+</span>
            </label>
          </div>
        </div>
      </div>

      {/* Media preview modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"
            onClick={() => setPreviewMedia(null)}
          >
            ×
          </button>
          {previewMedia.type === "image" ? (
            <img src={mediaUrls[previewMedia.id] || ""} alt={previewMedia.name} className="max-w-full max-h-full" />
          ) : (
            <video src={mediaUrls[previewMedia.id] || ""} controls className="max-w-full max-h-full" />
          )}
        </div>
      )}
    </>
  );
}
