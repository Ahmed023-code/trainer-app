"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { Exercise, Routine, SetItem } from "@/components/workout/types";
import ExerciseSection from "@/components/workout/ExerciseSection";
import ExerciseLibraryModal from "@/components/workout/ExerciseLibraryModal";
import RoutinesModal from "@/components/workout/RoutinesModal";
import ExerciseHistoryModal from "@/components/workout/ExerciseHistoryModal";
// CHANGE: Added WorkoutMiniChart import for new emoji-free chart
import WorkoutChart from "@/components/workout/WorkoutChart";
import WorkoutMiniChart from "@/components/workout/WorkoutMiniChart";
import DaySelector from "@/components/ui/DaySelector";
import { useDaySelector } from "@/hooks/useDaySelector";
import { readWorkout, writeWorkout } from "@/stores/storageV2";


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
  if (/(abs|core|oblique)/.test(x)) return "Core"; // Abs + Obliques => Core
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
  
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Workout-level notes
  const [workoutNotes, setWorkoutNotes] = useState<string>("");

  // Add key for transition effect on date change
  const [contentKey, setContentKey] = useState(0);

  // FAB + modals
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showRoutines, setShowRoutines] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyExerciseName, setHistoryExerciseName] = useState("");

  // Stopwatch/Timer
  const [showClockMenu, setShowClockMenu] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showStopwatch, setShowStopwatch] = useState(false);

  const [timerInput, setTimerInput] = useState<{ hours: number; min: number; sec: number }>({
    hours: 0,
    min: 0,
    sec: 0,
  });
  const [timerTime, setTimerTime] = useState<number>(0);
  const [runningTimer, setRunningTimer] = useState<boolean>(false);

  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [runningStopwatch, setRunningStopwatch] = useState<boolean>(false);

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
    setContentKey((k) => k + 1); // Trigger transition
  }, [dateISO]);

  // Save data whenever exercises or notes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      writeWorkout(dateISO, { exercises, notes: workoutNotes });
    }, 300); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [exercises, workoutNotes, dateISO]);

  // timer tick
  useEffect(() => {
    if (!runningTimer || timerTime <= 0) return;
    const t = setInterval(() => {
      setTimerTime((v) => {
        if (v <= 1) {
          setRunningTimer(false);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [runningTimer, timerTime]);

  // stopwatch tick
  useEffect(() => {
    if (!runningStopwatch) return;
    const t = setInterval(() => {
      setStopwatchTime((v) => v + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [runningStopwatch]);

  const addExercise = (ex: Exercise) => {
    setExercises((prev) => [...prev, ex]);
  };
  const updateExercise = (idx: number, next: Exercise) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? next : e)));
  };
  const deleteExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const fmtHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Sets-by-muscle card data
  const setCounts = useMemo(() => {
    const base: Record<string, number> = Object.fromEntries(
      MUSCLE_ORDER.map((k) => [k, 0])
    ) as Record<string, number>;

    for (const ex of exercises) {
      const nameKey = ex.name.toLowerCase().trim();

      // prefer per-exercise override if present (from custom quick-add)
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

      // count only Working or Drop Set
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

  // CHANGE: Prepare chart data for WorkoutMiniChart (sets per muscle group)
  const chartData = useMemo(() => {
    return MUSCLE_ORDER
      .map((muscle) => ({ label: muscle, value: setCounts[muscle] || 0 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [setCounts]);

  // Scroll to exercise by muscle group
  const handleBarClick = (muscle: string) => {
    // Find first exercise that targets this muscle
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

      if (groups.includes(muscle)) {
        const ref = exerciseRefs.current[ex.name];
        if (ref) {
          ref.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <header className="pt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1">
            <DaySelector
              dateISO={dateISO}
              dateObj={dateObj}
              onPrev={goPrevDay}
              onNext={goNextDay}
              onSelect={setDateISO}
              isToday={isToday}
            />
          </div>
          <a
            href={`/settings/workout?returnDate=${dateISO}`}
            className="tap-target min-w-10 min-h-10 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium bg-[var(--accent-workout)] text-white hover:opacity-90 transition-opacity"
            aria-label="Workout Settings"
          >
            <img src="/icons/fi-sr-settings.svg" alt="" className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* CHANGE: Replaced old chart with new emoji-free WorkoutMiniChart */}
      {/* Workout Chart */}
      <section key={contentKey} className="mt-4 transition-all duration-150">
        <WorkoutMiniChart data={chartData} variant="column" accentColor="var(--accent-workout)" />
      </section>

      {/* Exercise list inside page-level bubbles */}
      <section key={contentKey} className="space-y-6 relative z-0 overflow-visible mt-4 transition-all duration-150">
        {exercises.map((ex, i) => (
          <div
            key={`${ex.name}-${i}`}
            ref={(el) => { exerciseRefs.current[ex.name] = el; }}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm overflow-visible"
          >
            <ExerciseSection
              exercise={ex}
              onChange={(next) => updateExercise(i, next)}
              onDelete={() => deleteExercise(i)}
              onHistory={() => {
                setHistoryExerciseName(ex.name);
                setShowHistory(true);
              }}
            />

            {/* Per-exercise notes */}
            <label className="block text-sm mt-3">
              Notes
              <textarea
                className="w-full mt-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                rows={2}
                placeholder="Add notes..."
                value={(ex as any).notes || ""}
                onChange={(e) => {
                  const next: any = { ...ex, notes: e.target.value };
                  updateExercise(i, next);
                }}
              />
            </label>
          </div>
        ))}

        {exercises.length === 0 && (
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-16">
            No entries for {dateISO}. Tap the + to add one.
          </div>
        )}
      </section>

      {/* Workout-level notes */}
      <section key={contentKey} className="px-4 mt-6 transition-all duration-150">
        <label className="block text-sm">
          Workout Notes
          <textarea
            className="w-full mt-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
            rows={3}
            placeholder="Add notes for today's workout..."
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
          />
        </label>
      </section>

      {/* Stopwatch/Timer launcher button (above FAB) */}
      <div className="fixed right-6 bottom-[7.5rem] z-[9400]">
        <button
          className="w-16 h-16 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 grid place-items-center shadow-lg"
          aria-label="Timer/Stopwatch"
          onClick={() => setShowClockMenu((v) => !v)}
        >
          <img src="/icons/fi-sr-stopwatch.svg" alt="" className="w-6 h-6 dark:invert" />
        </button>

        {showClockMenu && (
          <>
            <button
              className="fixed inset-0 z-[9398]"
              aria-label="Close"
              onClick={() => setShowClockMenu(false)}
            />
            <div className="absolute right-0 bottom-20 z-[9399] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-2 w-48">
              <button
                className="flex w-full items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  setShowClockMenu(false);
                  setShowTimer(true);
                }}
              >
                <img src="/icons/fi-sr-time-oclock.svg" alt="Timer" className="w-4 h-4 dark:invert" />
                Timer
              </button>

              <button
                className="mt-1 flex w-full items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  setShowClockMenu(false);
                  setShowStopwatch(true);
                }}
              >
                <img src="/icons/fi-sr-stopwatch.svg" alt="Stopwatch" className="w-4 h-4 dark:invert" />
                Stopwatch
              </button>
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <div className="fixed right-6 bottom-6 z-[9400]">
        <button
          className="w-16 h-16 rounded-full bg-accent-workout text-black grid place-items-center text-3xl shadow-lg"
          aria-label="Add"
          onClick={() => setShowFabMenu((v) => !v)}
        >
          +
        </button>

        {showFabMenu && (
          <>
            <button
              className="fixed inset-0 z-[9398]"
              aria-label="Close"
              onClick={() => setShowFabMenu(false)}
            />
            <div className="absolute right-0 bottom-20 z-[9399] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-2 w-48">
              <button
                className="flex w-full items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  setShowFabMenu(false);
                  setShowLibrary(true);
                }}
              >
                <img src="/icons/fi-sr-plus-small.svg" alt="" className="w-4 h-4 dark:invert" />
                Quick Add
              </button>
              <button
                className="mt-1 flex w-full items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  setShowFabMenu(false);
                  setShowRoutines(true);
                }}
              >
                <img src="/icons/fi-sr-routines.svg" alt="" className="w-4 h-4 dark:invert" />
                Routines
              </button>
            </div>
          </>
        )}
      </div>

      {/* Exercise search */}
      <ExerciseLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onPick={(ex) => {
          addExercise(ex);
          setShowLibrary(false);
        }}
      />

      {/* Routines */}
      <RoutinesModal
        isOpen={showRoutines}
        onClose={() => setShowRoutines(false)}
        onSaveRoutine={() => {}}
        onPickRoutine={(r) => {
          const exs = deepCopyRoutine(r);
          setExercises((prev) => [...prev, ...exs]);
          setShowRoutines(false);
        }}
      />

      {/* TIMER MODAL */}
      {showTimer && (
        <div className="fixed inset-0 z-[9600]">
          <button
            className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => {
              setShowTimer(false);
              setRunningTimer(false);
            }}
          />
          <div className="absolute right-6 bottom-28 w-[min(92vw,420px)] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-4">
            <div className="text-lg font-medium mb-2">Timer</div>

            <div className="flex justify-center gap-6 mb-3">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                  onClick={() => setTimerInput((v) => ({ ...v, hours: (v.hours || 0) + 1 }))}
                >
                  +
                </button>
                <div className="w-12 text-center text-lg">{timerInput.hours || 0}</div>
                <button
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                  onClick={() => setTimerInput((v) => ({ ...v, hours: Math.max(0, (v.hours || 0) - 1) }))}
                >
                  –
                </button>
                <span className="text-xs mt-1">hrs</span>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                  onClick={() => setTimerInput((v) => ({ ...v, min: (v.min || 0) + 1 }))}
                >
                  +
                </button>
                <div className="w-12 text-center text-lg">{timerInput.min || 0}</div>
                <button
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                  onClick={() => setTimerInput((v) => ({ ...v, min: Math.max(0, (v.min || 0) - 1) }))}
                >
                  –
                </button>
                <span className="text-xs mt-1">min</span>
              </div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <button
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                  onClick={() => setTimerInput((v) => ({ ...v, sec: (v.sec || 0) + 1 }))}
                >
                  +
                </button>
                <div className="w-12 text-center text-lg">{timerInput.sec || 0}</div>
                <button
                  className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                  onClick={() => setTimerInput((v) => ({ ...v, sec: Math.max(0, (v.sec || 0) - 1) }))}
                >
                  –
                </button>
                <span className="text-xs mt-1">sec</span>
              </div>
            </div>

            <div className="text-xl mb-2 text-center tabular-nums">
              {(() => {
                const total =
                  (timerInput.hours || 0) * 3600 +
                  (timerInput.min || 0) * 60 +
                  (timerInput.sec || 0);
                const t = runningTimer ? timerTime : total;
                const h = Math.floor(t / 3600);
                const m = Math.floor((t % 3600) / 60);
                const s = t % 60;
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${pad(h)}:${pad(m)}:${pad(s)}`;
              })()}
            </div>

            <div className="flex justify-center items-center gap-4 mt-2">
              <button
                className="w-12 h-12 rounded-full bg-accent-workout text-black grid place-items-center"
                onClick={() => {
                  if (!runningTimer) {
                    const total =
                      (timerInput.hours || 0) * 3600 +
                      (timerInput.min || 0) * 60 +
                      (timerInput.sec || 0);
                    setTimerTime(total);
                  }
                  setRunningTimer((v) => !v);
                }}
              >
                <img
                  src="/icons/fi-sr-play.svg"
                  alt="Play"
                  className={`w-4 h-4 ${runningTimer ? "hidden" : ""}`}
                />
                <span className={`${runningTimer ? "block" : "hidden"} text-lg`}>⏸</span>
              </button>

              <button
                className="w-12 h-12 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center"
                onClick={() => {
                  setRunningTimer(false);
                  setTimerTime(0);
                  setTimerInput({ hours: 0, min: 0, sec: 0 });
                }}
              >
                <img src="/icons/fi-sr-arrows-retweet.svg" alt="Reset" className="w-5 h-5 dark:invert" />
              </button>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
                onClick={() => {
                  setShowTimer(false);
                  setRunningTimer(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOPWATCH MODAL */}
      {showStopwatch && (
        <div className="fixed inset-0 z-[9600]">
          <button
            className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => {
              setShowStopwatch(false);
              setRunningStopwatch(false);
            }}
          />
          <div className="absolute right-6 bottom-28 w-[min(92vw,420px)] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-4">
            <div className="text-lg font-medium mb-2">Stopwatch</div>

            <div className="text-3xl text-center tabular-nums mb-3">
              {(() => {
                const t = stopwatchTime;
                const h = Math.floor(t / 3600);
                const m = Math.floor((t % 3600) / 60);
                const s = t % 60;
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${pad(h)}:${pad(m)}:${pad(s)}`;
              })()}
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                className="w-12 h-12 rounded-full bg-accent-workout text-black grid place-items-center"
                onClick={() => setRunningStopwatch((v) => !v)}
              >
                <img
                  src="/icons/fi-sr-play.svg"
                  alt="Start"
                  className={`w-4 h-4 ${runningStopwatch ? "hidden" : ""}`}
                />
                <span className={`${runningStopwatch ? "block" : "hidden"} text-lg`}>⏸</span>
              </button>
              <button
                className="w-12 h-12 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center"
                onClick={() => {
                  setRunningStopwatch(false);
                  setStopwatchTime(0);
                }}
              >
                <img src="/icons/fi-sr-arrows-retweet.svg" alt="Reset" className="w-5 h-5 dark:invert" />
              </button>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
                onClick={() => {
                  setShowStopwatch(false);
                  setRunningStopwatch(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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