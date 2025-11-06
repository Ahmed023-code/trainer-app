"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkoutGoalsStore } from "@/stores/workoutGoalsStore";
import type { WorkoutSplit, WorkoutFocus } from "@/stores/workoutGoalsStore";

function WorkoutSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnDate = searchParams.get("returnDate");

  const { sessionsPerWeek, split, targetDurationMin, focus, setSessionsPerWeek, setSplit, setTargetDuration, setFocus } =
    useWorkoutGoalsStore();

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBack = () => {
    if (returnDate) {
      router.push(`/workout?date=${returnDate}`);
    } else {
      router.push("/settings");
    }
  };

  const splitLabels: Record<WorkoutSplit, string> = {
    ppl: "Push/Pull/Legs",
    upperLower: "Upper/Lower",
    fullBody: "Full Body",
    bodyPart: "Body Part Split",
    custom: "Custom",
  };

  const focusLabels: Record<WorkoutFocus, string> = {
    strength: "Strength (1-5 reps)",
    hypertrophy: "Hypertrophy (6-12 reps)",
    endurance: "Endurance (12+ reps)",
    mixed: "Mixed",
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      <div className="pt-4 flex items-center gap-3">
        <button onClick={handleBack} className="text-2xl" aria-label="Back">
          ←
        </button>
        <h1 className="text-xl font-semibold">Workout Settings</h1>
      </div>

      {/* Sessions Per Week */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Training Frequency</h2>
        <label className="text-sm block">
          Sessions Per Week
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="7"
              value={sessionsPerWeek}
              onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
              className="flex-1"
            />
            <div className="text-2xl font-bold text-[var(--accent-workout)] min-w-[3ch] text-center">{sessionsPerWeek}</div>
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
          </div>
        </label>
      </section>

      {/* Split */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Training Split</h2>
        <div className="space-y-2">
          {(["ppl", "upperLower", "fullBody", "bodyPart", "custom"] as WorkoutSplit[]).map((s) => (
            <button
              key={s}
              onClick={() => setSplit(s)}
              className={`w-full px-4 py-3 rounded-full text-sm font-medium text-left transition-colors ${
                split === s
                  ? "bg-[var(--accent-workout)] text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {splitLabels[s]}
            </button>
          ))}
        </div>
      </section>

      {/* Target Duration */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Target Session Duration</h2>
        <label className="text-sm block">
          Minutes Per Session
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={targetDurationMin}
              onChange={(e) => setTargetDuration(Number(e.target.value))}
              className="flex-1"
            />
            <div className="text-2xl font-bold text-[var(--accent-workout)] min-w-[4ch] text-center">{targetDurationMin}</div>
          </div>
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>15m</span>
            <span>60m</span>
            <span>120m</span>
            <span>180m</span>
          </div>
        </label>
      </section>

      {/* Primary Focus */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Primary Focus</h2>
        <div className="space-y-2">
          {(["strength", "hypertrophy", "endurance", "mixed"] as WorkoutFocus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFocus(f)}
              className={`w-full px-4 py-3 rounded-full text-sm font-medium text-left transition-colors ${
                focus === f
                  ? "bg-[var(--accent-workout)] text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {focusLabels[f]}
            </button>
          ))}
        </div>
      </section>

      {/* Summary */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-[var(--accent-workout)]/10 to-[var(--accent-workout)]/5 p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Your Workout Plan</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Frequency</span>
            <span className="font-medium">{sessionsPerWeek}x per week</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Split</span>
            <span className="font-medium">{splitLabels[split]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Duration</span>
            <span className="font-medium">{targetDurationMin} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Focus</span>
            <span className="font-medium capitalize">{focus}</span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+16px)] flex gap-3">
        <button
          onClick={handleBack}
          className="px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-3 rounded-full bg-[var(--accent-workout)] text-white font-medium hover:opacity-90"
        >
          Save Settings
        </button>
      </div>

      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-50">
          ✓ Settings saved!
        </div>
      )}
    </main>
  );
}

export default function WorkoutSettingsPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] pt-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">←</div>
          <h1 className="text-xl font-semibold">Workout Settings</h1>
        </div>
      </main>
    }>
      <WorkoutSettingsContent />
    </Suspense>
  );
}
