"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTodayISO } from "@/utils/completion";
import { readDiet, readWorkout, readWeight, writeWeight } from "@/stores/storageV2";
import { useInboxStore } from "@/stores/inboxStore";
import MacroRings from "@/components/diet/MacroRings";
import DaySelector from "@/components/ui/DaySelector";
import NutritionOverview from "@/components/diet/NutritionOverview";

// Load exercises data for body parts
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

export default function HomePage() {
  const router = useRouter();
  const todayISO = getTodayISO();

  // Create Date object for today to use with DaySelector
  const todayObj = useMemo(() => new Date(todayISO + "T00:00:00"), [todayISO]);

  // Go to Today function (no-op for Home since it's always today, but needed for consistency)
  const goToToday = () => {
    // Home is always on today, but we reload data to ensure freshness
    window.location.reload();
  };

  const { reminders, addReminder, toggleReminder, removeReminder } = useInboxStore();

  // Weight state
  const [weightValue, setWeightValue] = useState<string>("");
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [savedWeight, setSavedWeight] = useState<number | null>(null);

  // Diet/workout data
  const [dietSummary, setDietSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, goals: { cal: 2400, p: 180, c: 240, f: 70 } });
  const [workoutSummary, setWorkoutSummary] = useState({ exerciseCount: 0, setCount: 0, exerciseNames: [] as string[] });

  // Reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDue, setReminderDue] = useState("");

  // Diet menu and nutrition overview
  const [showDietMenu, setShowDietMenu] = useState(false);
  const [showNutritionOverview, setShowNutritionOverview] = useState(false);

  // Close diet menu on scroll
  useEffect(() => {
    if (!showDietMenu) return;

    const handleScroll = () => {
      setShowDietMenu(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showDietMenu]);

  // Load data for today
  useEffect(() => {
    const loadData = () => {
      // Load weight
      const weight = readWeight(todayISO);
      setSavedWeight(weight);
      setWeightValue(weight !== null ? weight.toFixed(1) : "");

      // Load weight history (last 7 days)
      const history: number[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(todayISO);
        d.setDate(d.getDate() - i);
        const w = readWeight(d.toISOString().split("T")[0]);
        if (w !== null) history.push(w);
      }
      setWeightHistory(history.reverse());

      // Load diet summary
      const diet = readDiet(todayISO);
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
      const workout = readWorkout(todayISO);
      const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.type === "Working" || s.type === "Drop Set").length, 0);

      setWorkoutSummary({
        exerciseCount: workout.exercises.length,
        setCount,
        exerciseNames: workout.exercises.map(ex => ex.name),
      });
    };

    loadData();

    // Reload diet goals when page becomes visible or storage changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const diet = readDiet(todayISO);
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
      const diet = readDiet(todayISO);
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
        const diet = readDiet(todayISO);
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
      if (customEvent.detail?.dateISO === todayISO) {
        const diet = readDiet(todayISO);
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
  }, [todayISO]);

  // Save weight
  const saveWeight = () => {
    const value = parseFloat(weightValue);
    if (!isNaN(value) && value > 0) {
      writeWeight(todayISO, value);
      setSavedWeight(value);
      setWeightValue(value.toFixed(1));
    }
  };

  // Navigate to diet/workout with date
  const openDiet = () => {
    localStorage.setItem("ui-last-date-diet", todayISO);
    router.push(`/diet`);
  };

  const openWorkout = () => {
    localStorage.setItem("ui-last-date-workout", todayISO);
    router.push(`/workout`);
  };

  const handleAddReminder = () => {
    if (reminderTitle.trim()) {
      addReminder(reminderTitle, reminderDue || undefined);
      setReminderTitle("");
      setReminderDue("");
      setShowReminderModal(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      {/* Header with date display */}
      <header className="pt-4">
        <DaySelector
          dateISO={todayISO}
          dateObj={todayObj}
          onPrev={() => {}}
          onNext={() => {}}
          onSelect={() => {}}
          isToday={true}
          showNavigation={false}
          onGoToToday={goToToday}
          accentColor="var(--accent-home)"
        />
      </header>

      {/* Weight card */}
      <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 px-5 shadow-sm">
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
            className="flex-1 rounded-full border border-neutral-300 dark:border-neutral-700 px-4 py-2 bg-white dark:bg-neutral-900 text-sm"
          />
          {savedWeight === null || parseFloat(weightValue) !== savedWeight ? (
            <button
              onClick={saveWeight}
              className="px-3 py-1.5 rounded-full bg-accent-home text-white text-sm font-medium hover:opacity-90 transition-opacity"
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
                <div key={i} className="flex-1 bg-accent-home/30 rounded-t" style={{ height: `${height}%` }} />
              );
            })}
          </div>
        )}
      </div>

      {/* Diet summary */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Diet Summary</h2>
          <button
            onClick={openDiet}
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
              onMenuClick={() => setShowDietMenu(!showDietMenu)}
            />
          </div>
        </div>

        {/* Menu popup */}
        {showDietMenu && (
          <>
            <button
              className="fixed inset-0 z-[99998]"
              aria-label="Close"
              onClick={() => setShowDietMenu(false)}
            />
            <div className="absolute right-4 top-[calc(100%-1rem)] z-[99999] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-3 w-48 space-y-2">
              <button
                onClick={() => {
                  setShowNutritionOverview(true);
                  setShowDietMenu(false);
                }}
                className="block w-full text-center px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Diet Details
              </button>
              <a
                href={`/settings/diet?returnDate=${todayISO}`}
                className="block w-full text-center px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => setShowDietMenu(false)}
              >
                Diet Settings
              </a>
            </div>
          </>
        )}
      </div>

      {/* Workout summary */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Workout Summary</h2>
          <button
            onClick={openWorkout}
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

      {/* Reminders */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Reminders</h2>
          <button
            onClick={() => setShowReminderModal(true)}
            className="tap-target w-8 h-8 rounded-full bg-accent-home text-white flex items-center justify-center text-lg font-bold"
            aria-label="Add reminder"
          >
            +
          </button>
        </div>
        {reminders.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No reminders</p>
        ) : (
          <ul className="space-y-2">
            {reminders.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={r.done}
                  onChange={() => toggleReminder(r.id)}
                  className="w-4 h-4 rounded"
                />
                <span className={`text-sm flex-1 ${r.done ? "line-through text-neutral-400" : ""}`}>
                  {r.title}
                </span>
                <button
                  onClick={() => removeReminder(r.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reminder modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add Reminder</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="input"
                  placeholder="Reminder title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
                <input
                  type="date"
                  value={reminderDue}
                  onChange={(e) => setReminderDue(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="flex-1 py-2 rounded-full bg-accent-home text-white font-medium hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition overview page */}
      <NutritionOverview
        isOpen={showNutritionOverview}
        meals={readDiet(todayISO).meals}
        goals={dietSummary.goals}
        onClose={() => setShowNutritionOverview(false)}
      />
    </main>
  );
}
