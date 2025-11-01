"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readDiet, readWorkout, readWeight, writeWeight, listMedia, addMedia, removeMedia, getMediaBlob } from "@/stores/storageV2";
import MacroRings from "@/components/diet/MacroRings";
import CompletionBadge from "@/components/ui/CompletionBadge";
import { isDayComplete } from "@/utils/completion";
import WeightTrendCard from "@/components/progress/WeightTrendCard";
import type { MediaItem } from "@/stores/storageV2";

interface DayViewProps {
  dateISO: string;
  isToday: boolean;
}

export default function DayView({ dateISO, isToday }: DayViewProps) {
  const router = useRouter();
  const dayComplete = isDayComplete(dateISO);

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
  const [workoutSummary, setWorkoutSummary] = useState({ exerciseCount: 0, setCount: 0, volume: 0 });

  // Load data for selected date
  useEffect(() => {
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
    const volume = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.type === "Working" || s.type === "Drop Set").reduce((s, x) => s + (x.weight * ((x.repsMin + x.repsMax) / 2)), 0), 0);

    setWorkoutSummary({
      exerciseCount: workout.exercises.length,
      setCount,
      volume: Math.round(volume),
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
        {/* Today pill and completion badge */}
        <div className="flex items-center justify-center gap-3">
          {isToday && (
            <span className="px-3 py-1 text-xs bg-accent-progress text-white rounded-full">Today</span>
          )}
          {dayComplete && <CompletionBadge />}
        </div>

        {/* Weight card */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <label className="block text-sm font-medium mb-2">Weight</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="decimal"
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              placeholder="0.0"
              className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
            />
            <button
              onClick={saveWeight}
              className="px-4 py-2 rounded-lg bg-accent-progress text-white font-medium"
            >
              Save
            </button>
          </div>

          {/* Mini sparkline */}
          {weightHistory.length > 1 && (
            <div className="mt-3 flex items-end gap-1 h-16">
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

        {/* Weight Trend Card */}
        <WeightTrendCard range="1m" />

        {/* Diet summary */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Diet Summary</h2>
            <button
              onClick={openDietForDate}
              className="tap-target px-3 py-1.5 rounded-lg bg-accent-diet text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Open Diet
            </button>
          </div>
          <div className="flex justify-center">
            <MacroRings
              calories={{ label: "Cal", color: "var(--accent-diet)", current: Math.round(dietSummary.calories), target: dietSummary.goals.cal }}
              protein={{ label: "P", color: "#F87171", current: Math.round(dietSummary.protein), target: dietSummary.goals.p }}
              fat={{ label: "F", color: "var(--accent-diet-fat)", current: Math.round(dietSummary.fat), target: dietSummary.goals.f }}
              carbs={{ label: "C", color: "#60A5FA", current: Math.round(dietSummary.carbs), target: dietSummary.goals.c }}
            />
          </div>
        </div>

        {/* Workout summary */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Workout Summary</h2>
            <button
              onClick={openWorkoutForDate}
              className="tap-target px-3 py-1.5 rounded-lg bg-[var(--accent-workout)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Open Workout
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{workoutSummary.exerciseCount}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Exercises</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{workoutSummary.setCount}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Sets</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{workoutSummary.volume}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Volume (lbs)</div>
            </div>
          </div>
        </div>

        {/* Media gallery */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <h2 className="font-medium mb-3">Media</h2>
          <div className="grid grid-cols-3 gap-2">
            {mediaItems.map(item => (
              <div key={item.id} className="relative aspect-square">
                <img
                  src={mediaUrls[item.id] || ""}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
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
            <label className="aspect-square border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
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
