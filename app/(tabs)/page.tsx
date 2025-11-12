"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getTodayISO } from "@/utils/completion";
import { readDiet, readWorkout, readWeight, writeWeight } from "@/stores/storageV2";
import { useInboxStore } from "@/stores/inboxStore";
import { useSettingsStore } from "@/stores/settingsStore";
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
  const { weightUnit } = useSettingsStore();

  // Create Date object for today to use with DaySelector
  const todayObj = useMemo(() => new Date(todayISO + "T00:00:00"), [todayISO]);

  // Go to Today function (no-op for Home since it's always today, but needed for consistency)
  const goToToday = () => {
    // Home is always on today, but we reload data to ensure freshness
    window.location.reload();
  };

  const { reminders, addReminder, toggleReminder, removeReminder } = useInboxStore();

  // Weight editing state
  const [isEditingWeight, setIsEditingWeight] = useState(false);

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

  // Nutrition overview
  const [showNutritionOverview, setShowNutritionOverview] = useState(false);

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
      setIsEditingWeight(false);
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
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm">
        <div className="p-3">
          <label className="block text-sm font-medium mb-2">Weight</label>

          {savedWeight === null || parseFloat(weightValue) !== savedWeight || isEditingWeight ? (
            // Edit mode - show plus/minus buttons with clickable weight in center
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const current = parseFloat(weightValue) || 0;
                  const newValue = Math.max(0, current - 0.5);
                  setWeightValue(newValue.toFixed(1));
                }}
                className="w-8 h-8 flex-shrink-0 rounded-full border-2 border-accent-home text-accent-home flex items-center justify-center hover:bg-accent-home/10 transition-colors font-bold text-lg"
              >
                −
              </button>

              <div className="flex-1 min-w-0">
                <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                     onClick={() => {
                       setIsEditingWeight(true);
                       setTimeout(() => {
                         const input = document.getElementById('weight-input') as HTMLInputElement;
                         if (input) {
                           input.focus();
                           input.select();
                         }
                       }, 0);
                     }}>
                  <input
                    id="weight-input"
                    type="number"
                    inputMode="decimal"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    onBlur={() => setIsEditingWeight(false)}
                    className="text-xl font-bold text-center bg-transparent border-none outline-none w-16 text-neutral-900 dark:text-neutral-100"
                    style={{ appearance: 'textfield' }}
                  />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{weightUnit}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const current = parseFloat(weightValue) || 0;
                  const newValue = current + 0.5;
                  setWeightValue(newValue.toFixed(1));
                }}
                className="w-8 h-8 flex-shrink-0 rounded-full border-2 border-accent-home text-accent-home flex items-center justify-center hover:bg-accent-home/10 transition-colors font-bold text-lg"
              >
                +
              </button>
            </div>
          ) : (
            // Saved mode - show weight with checkmark and edit button
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-green-600 dark:text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 flex items-center justify-center gap-2">
                  <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {savedWeight.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{weightUnit}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSavedWeight(null);
                  setIsEditingWeight(true);
                }}
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Edit weight"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            </div>
          )}

          {/* Save button below weight display when in edit mode */}
          {(savedWeight === null || parseFloat(weightValue) !== savedWeight || isEditingWeight) && (
            <div className="mt-2">
              <button
                onClick={saveWeight}
                className="w-full py-1.5 rounded-full bg-accent-home text-white text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Save Weight
              </button>
            </div>
          )}
        </div>
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

        {/* Layout: Large calorie ring on left, smaller macro rings in 2x2 grid on right */}
        <div className="flex gap-4 items-center">
          {/* Large calorie ring on left */}
          <div className="flex-shrink-0">
            <CalorieRing
              current={Math.round(dietSummary.calories)}
              target={dietSummary.goals.cal}
              protein={Math.round(dietSummary.protein)}
              carbs={Math.round(dietSummary.carbs)}
              fat={Math.round(dietSummary.fat)}
              proteinTarget={dietSummary.goals.p}
              carbsTarget={dietSummary.goals.c}
              fatTarget={dietSummary.goals.f}
            />
          </div>

          {/* Smaller macro rings in 2x2 grid on right */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <SmallMacroRing
              label="Cal"
              current={Math.round(dietSummary.calories)}
              target={dietSummary.goals.cal}
              color="var(--accent-diet)"
            />
            <SmallMacroRing
              label="P"
              current={Math.round(dietSummary.protein)}
              target={dietSummary.goals.p}
              color="#F87171"
            />
            <SmallMacroRing
              label="F"
              current={Math.round(dietSummary.fat)}
              target={dietSummary.goals.f}
              color="#FACC15"
            />
            <SmallMacroRing
              label="C"
              current={Math.round(dietSummary.carbs)}
              target={dietSummary.goals.c}
              color="#60A5FA"
            />
          </div>
        </div>
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

      {/* Reminders inbox */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Inbox</h2>
          <button
            onClick={() => setShowReminderModal(true)}
            className="tap-target px-3 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black text-xs font-medium hover:opacity-90 transition-opacity"
          >
            + New Reminder
          </button>
        </div>

        {reminders.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            No reminders yet
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
              >
                <input
                  type="checkbox"
                  checked={reminder.done}
                  onChange={() => toggleReminder(reminder.id)}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      reminder.done
                        ? "line-through text-neutral-400 dark:text-neutral-500"
                        : "text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {reminder.title}
                  </p>
                  {reminder.dueISO && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Due: {new Date(reminder.dueISO).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeReminder(reminder.id)}
                  className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Delete reminder"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Reminder Modal */}
      {showReminderModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReminderModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">New Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="What do you need to remember?"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
                <input
                  type="date"
                  value={reminderDue}
                  onChange={(e) => setReminderDue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    if (reminderTitle.trim()) {
                      addReminder(
                        reminderTitle,
                        reminderDue || undefined
                      );
                      setReminderTitle("");
                      setReminderDue("");
                      setShowReminderModal(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-medium hover:opacity-90 transition-opacity"
                >
                  Add Reminder
                </button>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderTitle("");
                    setReminderDue("");
                  }}
                  className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-600 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Overview Modal */}
      <NutritionOverview
        isOpen={showNutritionOverview}
        meals={readDiet(todayISO).meals}
        goals={dietSummary.goals}
        dateISO={todayISO}
        onClose={() => setShowNutritionOverview(false)}
      />
    </main>
  );
}

// Large calorie ring component (similar to the one in NutritionOverview but simplified)
function CalorieRing({
  current,
  target,
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget
}: {
  current: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}) {
  const size = 140;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate calories from each macro
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const totalCals = proteinCals + carbsCals + fatCals;

  // Calculate percentages of the ring based on caloric contribution
  const proteinPct = totalCals > 0 ? proteinCals / totalCals : 0.33;
  const fatPct = totalCals > 0 ? fatCals / totalCals : 0.33;
  const carbsPct = totalCals > 0 ? carbsCals / totalCals : 0.34;

  // Ring circumference represents consumption relative to goal
  const fillPct = target > 0 ? current / target : 0;
  const totalFill = fillPct <= 1 ? circumference * fillPct : circumference;

  // Calculate dash lengths for each segment
  const proteinDash = totalFill * proteinPct;
  const fatDash = totalFill * fatPct;
  const carbsDash = totalFill * carbsPct;

  // Check if each macro is over its target
  const proteinOver = protein > proteinTarget;
  const carbsOver = carbs > carbsTarget;
  const fatOver = fat > fatTarget;

  // Calculate segment portions (normal vs overage)
  const getSegmentPortions = (
    curr: number,
    targ: number,
    totalDash: number
  ) => {
    if (curr <= targ) {
      return { normalDash: totalDash, overageDash: 0 };
    }
    const normalPortion = targ / curr;
    const normalDash = totalDash * normalPortion;
    const overageDash = totalDash - normalDash;
    return { normalDash, overageDash };
  };

  const proteinPortions = getSegmentPortions(protein, proteinTarget, proteinDash);
  const fatPortions = getSegmentPortions(fat, fatTarget, fatDash);
  const carbsPortions = getSegmentPortions(carbs, carbsTarget, carbsDash);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] w-full h-full">
        {/* Define stripe patterns for overage */}
        <defs>
          <pattern
            id="stripe-protein-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect width="1.5" height="3" fill="currentColor" className="text-white dark:text-black" opacity="0.5" />
          </pattern>
          <pattern
            id="stripe-fat-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect width="1.5" height="3" fill="currentColor" className="text-white dark:text-black" opacity="0.5" />
          </pattern>
          <pattern
            id="stripe-carbs-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect width="1.5" height="3" fill="currentColor" className="text-white dark:text-black" opacity="0.5" />
          </pattern>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={stroke}
          fill="none"
          className="text-neutral-400 dark:text-neutral-600"
        />

        {/* Protein segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F87171"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${proteinPortions.normalDash} ${circumference - proteinPortions.normalDash}`}
          strokeDashoffset="0"
          fill="none"
        />
        {/* Protein segment - overage portion */}
        {proteinOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#B84444"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${proteinPortions.overageDash} ${circumference - proteinPortions.overageDash}`}
              strokeDashoffset={-proteinPortions.normalDash}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-protein-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${proteinPortions.overageDash} ${circumference - proteinPortions.overageDash}`}
              strokeDashoffset={-proteinPortions.normalDash}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        {/* Fat segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FACC15"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${fatPortions.normalDash} ${circumference - fatPortions.normalDash}`}
          strokeDashoffset={-proteinDash}
          fill="none"
        />
        {/* Fat segment - overage portion */}
        {fatOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#C9A000"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatPortions.overageDash} ${circumference - fatPortions.overageDash}`}
              strokeDashoffset={-(proteinDash + fatPortions.normalDash)}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-fat-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatPortions.overageDash} ${circumference - fatPortions.overageDash}`}
              strokeDashoffset={-(proteinDash + fatPortions.normalDash)}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        {/* Carbs segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#60A5FA"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${carbsPortions.normalDash} ${circumference - carbsPortions.normalDash}`}
          strokeDashoffset={-(proteinDash + fatDash)}
          fill="none"
        />
        {/* Carbs segment - overage portion */}
        {carbsOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3D7BC7"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsPortions.overageDash} ${circumference - carbsPortions.overageDash}`}
              strokeDashoffset={-(proteinDash + fatDash + carbsPortions.normalDash)}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-carbs-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsPortions.overageDash} ${circumference - carbsPortions.overageDash}`}
              strokeDashoffset={-(proteinDash + fatDash + carbsPortions.normalDash)}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {current}
        </div>
        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
          of {target}
        </div>
        <div className="text-[8px] text-neutral-400 dark:text-neutral-500">
          kcal
        </div>
      </div>
    </div>
  );
}

// Small macro ring component for the 2x2 grid
function SmallMacroRing({
  label,
  current,
  target,
  color
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const size = 70;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Allow ring to go beyond 100%, cap at 150% for visual display
  const pct = Math.max(0, Math.min(1.5, target > 0 ? current / target : 0));
  const dash = circumference * pct;

  // Track if we're at or below 100%
  const normalPct = Math.min(1, target > 0 ? current / target : 0);
  const normalDash = circumference * normalPct;

  // Calculate difference
  const diff = current - target;
  const isOver = diff > 0;
  const isUnder = diff < 0;

  // Get background color based on label
  const getBgColor = () => {
    if (label === "Cal") return "#34D3991F";
    if (label === "P") return "#F871711F";
    if (label === "F") return "#FACC151F";
    if (label === "C") return "#60A5FA1F";
    return `${color}22`;
  };

  // Get darker color for overage
  const getOverageColor = () => {
    if (label === "Cal") return "#1F9D6D";
    if (label === "P") return "#B84444";
    if (label === "F") return "#C9A000";
    if (label === "C") return "#3D7BC7";
    return color;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 rotate-[-90deg] w-full h-full">
          {/* Define stripe pattern for overage */}
          <defs>
            <pattern
              id={`stripe-${label}-small`}
              patternUnits="userSpaceOnUse"
              width="3"
              height="3"
              patternTransform="rotate(45)"
            >
              <rect width="1.5" height="3" fill="currentColor" className="text-white dark:text-black" opacity="0.5" />
            </pattern>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth={stroke}
            fill="none"
            className="text-neutral-400 dark:text-neutral-600"
          />

          {/* Base progress ring - shows up to 100% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${normalDash} ${circumference - normalDash}`}
            fill="none"
          />

          {/* Overage portion - shows amount beyond 100% */}
          {current > target && (
            <g>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={getOverageColor()}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${circumference - (dash - normalDash)}`}
                strokeDashoffset={-normalDash}
                fill="none"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#stripe-${label}-small)`}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${circumference - (dash - normalDash)}`}
                strokeDashoffset={-normalDash}
                fill="none"
                opacity="0.6"
              />
            </g>
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="inline-grid place-items-center rounded-full font-extrabold text-[9px] leading-none"
            style={{ width: 18, height: 18, backgroundColor: color, color: "#000" }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Value bubble under ring */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums whitespace-nowrap"
          style={{
            backgroundColor: getBgColor(),
            color: color
          }}
        >
          {current}/{target}
        </span>
        {/* Difference indicator */}
        {diff !== 0 && (
          <span className={`text-[8px] font-medium flex items-center gap-0.5 ${
            isOver ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
          }`}>
            {isOver ? '↑' : '↓'} {Math.abs(Math.round(diff))}
          </span>
        )}
      </div>
    </div>
  );
}
