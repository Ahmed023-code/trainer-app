"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { Exercise, Routine, SetItem } from "@/components/workout/types";
import ExerciseSection from "@/components/workout/ExerciseSection";
import ExerciseDetailModal from "@/components/workout/ExerciseDetailModal";
import ExerciseLibraryModal from "@/components/workout/ExerciseLibraryModal";
import RoutinesModal from "@/components/workout/RoutinesModal";
import ExerciseHistoryModal from "@/components/workout/ExerciseHistoryModal";
import ClockModal from "@/components/workout/ClockModal";
import DaySelector from "@/components/ui/DaySelector";
import { useDaySelector } from "@/hooks/useDaySelector";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { readWorkout, writeWorkout, getTodayISO } from "@/stores/storageV2";

const num = (v: any) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// Map arbitrary bodyPart strings to our groups
const mapBodyPartToGroup = (s: string): string | null => {
  const x = s.trim().toLowerCase();
  if (!x) return null;
  if (/(quad|thigh)/.test(x)) return "Quads";
  if (/(glute|glutes|butt)/.test(x)) return "Glutes";
  if (/(hamstring|posterior chain)/.test(x)) return "Hamstrings";
  if (/(calf|calves|gastrocnemius|soleus)/.test(x)) return "Calves";
  if (/(chest|pec)/.test(x)) return "Chest";
  if (/(back|lat|trap|rear delt|upper back|lats|traps)/.test(x)) return "Back";
  if (/(shoulder|delts?)/.test(x)) return "Shoulders";
  if (/(bicep)/.test(x)) return "Biceps";
  if (/(tricep)/.test(x)) return "Triceps";
  if (/(abs|core|oblique)/.test(x)) return "Core";
  return null;
};

const MUSCLE_ORDER = [
  "Quads",
  "Glutes",
  "Hamstrings",
  "Calves",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
] as const;

// Deep-copy a routine into exercises for today
const deepCopyRoutine = (r: Routine): Exercise[] =>
  r.exercises.map((e) => ({
    name: e.name,
    notes: (e as any).notes || "",
    sets: e.sets.map((s: any) => ({
      weight: num(s?.weight),
      repsMin:
        typeof s?.repsMin === "number"
          ? s.repsMin
          : typeof s?.reps === "number"
          ? s.reps
          : 10,
      repsMax:
        typeof s?.repsMax === "number"
          ? s.repsMax
          : typeof s?.reps === "number"
          ? s.reps
          : 10,
      rpe: typeof s?.rpe === "number" ? s.rpe : 8,
      type: s?.type || "Working",
      note: s?.note ?? "",
    })),
  }));

export default function WorkoutPage() {
  // Date selector
  const { dateISO, dateObj, goPrevDay, goNextDay, setDateISO, isToday } = useDaySelector("ui-last-date-workout");

  // Go to Today function
  const goToToday = () => {
    const today = getTodayISO();
    setDateISO(today);
    localStorage.setItem("ui-last-date-workout", today);
  };

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState<string>("");

  // FAB + modals - unified workout log modal with tabs
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  const [workoutLogTab, setWorkoutLogTab] = useState<"quick-add" | "routines">("quick-add");
  const [showHistory, setShowHistory] = useState(false);
  const [historyExerciseName, setHistoryExerciseName] = useState("");

  // Exercise detail modal
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);

  // Clock modal
  const [showClock, setShowClock] = useState(false);

  // Library index: exercise name -> groups[]
  const [libIndex, setLibIndex] = useState<Record<string, string[]>>({});

  // Refs for scrolling to exercises
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Build library index once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/data/exercises.json");
        const json = await res.json();
        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.exercises)
          ? json.exercises
          : [];
        const idx: Record<string, string[]> = {};
        for (const r of arr) {
          const name = String(r?.name || "").toLowerCase().trim();
          if (!name) continue;
          const bodyParts: string[] = Array.isArray(r?.bodyParts)
            ? r.bodyParts
            : r?.bodyPart
            ? [r.bodyPart]
            : [];
          const groups = Array.from(
            new Set(
              bodyParts
                .map((bp: any) => mapBodyPartToGroup(String(bp)))
                .filter(Boolean) as string[]
            )
          );
          if (groups.length) idx[name] = groups;
        }
        setLibIndex(idx);
      } catch {
        setLibIndex({});
      }
    })();
  }, []);

  // Load data for selected date
  useEffect(() => {
    const state = readWorkout(dateISO);
    setExercises(state.exercises || []);
    setWorkoutNotes(state.notes || "");
  }, [dateISO]);

  // Save data whenever exercises or notes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      writeWorkout(dateISO, { exercises, notes: workoutNotes });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [exercises, workoutNotes, dateISO]);

  const addExercise = (ex: Exercise) => {
    // Mark quick-add exercises with source field
    const exerciseWithSource: Exercise = {
      ...ex,
      source: "quick-add",
    };
    setExercises((prev) => [...prev, exerciseWithSource]);
  };
  const updateExercise = (idx: number, next: Exercise) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? next : e)));
  };
  const deleteExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add a set to an exercise
  const addSetToExercise = (exercise: Exercise) => {
    const idx = exercises.findIndex(e => e.name === exercise.name);
    if (idx === -1) return;

    const isQuickAdd = !exercise.source || exercise.source === "quick-add";
    const prev = exercise.sets[exercise.sets.length - 1];
    let newSet: SetItem;

    if (isQuickAdd) {
      // Quick-add: single reps value (repsMin = repsMax)
      newSet = prev
        ? { ...prev, repsPerformed: undefined }
        : { weight: 0, repsMin: 10, repsMax: 10, rpe: 8, type: "Working" };
    } else {
      // Routine: clone with rep range preserved, reset repsPerformed
      newSet = prev
        ? { ...prev, repsPerformed: undefined }
        : { weight: 0, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" };
    }

    const updatedExercise = {
      ...exercise,
      sets: [...exercise.sets, newSet]
    };
    updateExercise(idx, updatedExercise);
  };

  // Sets-by-muscle card data
  const setCounts = useMemo(() => {
    const base: Record<string, number> = Object.fromEntries(
      MUSCLE_ORDER.map((k) => [k, 0])
    ) as Record<string, number>;

    for (const ex of exercises) {
      const nameKey = ex.name.toLowerCase().trim();

      const overrideParts: string[] = Array.isArray((ex as any).bodyParts)
        ? (ex as any).bodyParts
        : [];

      const groups =
        overrideParts.length
          ? Array.from(
              new Set(
                overrideParts
                  .map((bp: any) => mapBodyPartToGroup(String(bp)))
                  .filter(Boolean) as string[]
              )
            )
          : (libIndex[nameKey] || []);

      if (!groups.length) continue;

      const count = ex.sets.reduce((n, s: any) => {
        const t = String(s?.type || "Working");
        return n + (t === "Working" || t === "Drop Set" ? 1 : 0);
      }, 0);

      if (count > 0) {
        const share = count / groups.length;
        for (const g of groups) base[g] = (base[g] ?? 0) + share;
      }
    }

    for (const k of MUSCLE_ORDER) base[k] = Math.round(base[k] ?? 0);
    return base;
  }, [exercises, libIndex]);

  // Prepare chart data for WorkoutMiniChart
  const chartData = useMemo(() => {
    return MUSCLE_ORDER
      .map((muscle) => ({ label: muscle, value: setCounts[muscle] || 0 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [setCounts]);

  // Drag and drop for exercises
  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(exercises, setExercises);

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <header className="pt-4 space-y-3">
        {/* Date selector with full-width Today button */}
        <DaySelector
          dateISO={dateISO}
          dateObj={dateObj}
          onPrev={goPrevDay}
          onNext={goNextDay}
          onSelect={setDateISO}
          isToday={isToday}
          onGoToToday={goToToday}
          accentColor="var(--accent-workout)"
          fullWidthLayout={true}
        />

        {/* Settings button below Today button, right-aligned */}
        <div className="flex justify-end">
          <a
            href={`/settings/workout?returnDate=${dateISO}`}
            className="tap-target w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent-workout)] text-white hover:opacity-90 transition-opacity shadow-sm"
            aria-label="Workout Settings"
          >
            <img src="/icons/fi-sr-settings.svg" alt="" className="w-4 h-4" />
          </a>
        </div>
      </header>


      {/* Exercise list - compact summary cards */}
      <section className="space-y-3 relative z-10 mt-4">
        {exercises.map((ex, i) => (
          <div
            key={`${ex.name}-${i}`}
            ref={(el) => { exerciseRefs.current[ex.name] = el; }}
            draggable
            onDragStart={handleDragStart(i)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter(i)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(i)}
            className={`rounded-xl border backdrop-blur p-1 shadow-sm overflow-visible cursor-move hover:shadow-md transition-all ${
              draggedIndex === i
                ? 'opacity-50 border-accent-workout'
                : dragOverIndex === i
                ? 'border-accent-workout border-2 scale-[1.02]'
                : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60'
            }`}
            onClick={() => setSelectedExerciseIndex(i)}
          >
            <ExerciseSection
              exercise={ex}
              onClick={() => setSelectedExerciseIndex(i)}
              onDelete={() => deleteExercise(i)}
              onAddSet={addSetToExercise}
              onUpdateExercise={(updated) => updateExercise(i, updated)}
            />
          </div>
        ))}

        {/* Log Workout button always visible */}
        <div className="flex items-center justify-center pt-4">
          <button
            onClick={() => setShowWorkoutLog(true)}
            className="px-8 py-3 rounded-full text-base font-medium border-2 bg-transparent transition-all hover:bg-opacity-5"
            style={{ borderColor: "var(--accent-workout)", color: "var(--accent-workout)", backgroundColor: "transparent" }}
          >
            + Log Workout
          </button>
        </div>
      </section>

      {/* Workout-level notes */}
      {exercises.length > 0 && (
        <section className="mt-6 relative z-0">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
            <label className="block text-sm font-medium mb-2">Workout Notes</label>
            <textarea
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 resize-none"
              rows={3}
              placeholder="Add notes for today's workout..."
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
            />
          </div>
        </section>
      )}

      {/* Clock launcher button */}
      <div className="fixed right-24 bottom-24 z-[9400]">
        <button
          className="w-14 h-14 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 grid place-items-center shadow-lg hover:scale-105 transition-transform"
          aria-label="Clock"
          onClick={() => setShowClock(true)}
        >
          <img src="/icons/fi-sr-stopwatch.svg" alt="" className="w-5 h-5 dark:invert" />
        </button>
      </div>

      {/* FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button
          className="w-14 h-14 rounded-full bg-accent-workout text-black shadow-lg flex items-center justify-center"
          aria-label="Add"
          onClick={() => setShowWorkoutLog(true)}
        >
          <span className="text-4xl leading-none" style={{ marginTop: '-2px' }}>+</span>
        </button>
      </div>

      {/* Unified Workout Log - render appropriate modal based on tab */}
      {showWorkoutLog && workoutLogTab === "quick-add" && (
        <ExerciseLibraryModal
          isOpen={true}
          onClose={() => setShowWorkoutLog(false)}
          onPick={(ex) => {
            addExercise(ex);
            setShowWorkoutLog(false);
          }}
          onSwitchToRoutines={() => setWorkoutLogTab("routines")}
        />
      )}

      {showWorkoutLog && workoutLogTab === "routines" && (
        <RoutinesModal
          isOpen={true}
          onClose={() => setShowWorkoutLog(false)}
          onSaveRoutine={() => {}}
          onPickRoutine={(r) => {
            setExercises((prev) => [...prev, ...r.exercises]);
            setShowWorkoutLog(false);
          }}
          onSwitchToQuickAdd={() => setWorkoutLogTab("quick-add")}
        />
      )}

      {/* Clock Modal */}
      <ClockModal isOpen={showClock} onClose={() => setShowClock(false)} />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        isOpen={selectedExerciseIndex !== null}
        exercise={selectedExerciseIndex !== null ? exercises[selectedExerciseIndex] : null}
        onClose={() => setSelectedExerciseIndex(null)}
        onChange={(next) => {
          if (selectedExerciseIndex !== null) {
            updateExercise(selectedExerciseIndex, next);
          }
        }}
        onDelete={() => {
          if (selectedExerciseIndex !== null) {
            deleteExercise(selectedExerciseIndex);
            setSelectedExerciseIndex(null);
          }
        }}
        onHistory={() => {
          if (selectedExerciseIndex !== null) {
            setHistoryExerciseName(exercises[selectedExerciseIndex].name);
            setShowHistory(true);
          }
        }}
      />

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        exerciseName={historyExerciseName}
        dateISO={dateISO}
      />
    </main>
  );
}
