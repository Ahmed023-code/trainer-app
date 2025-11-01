// CHANGE: Complete rewrite of Home tab with Today recap, reminders, messages, alerts, and deep links
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayISO, isDayComplete } from "@/utils/completion";
import { readDiet, readWorkout, readWeight } from "@/stores/storageV2";
import { useInboxStore } from "@/stores/inboxStore";
import MacroRings from "@/components/diet/MacroRings";
import CompletionBadge from "@/components/ui/CompletionBadge";

export default function HomePage() {
  const router = useRouter();
  const todayISO = getTodayISO();
  const isComplete = isDayComplete(todayISO);

  const { reminders, messages, alerts, addReminder, toggleReminder, removeReminder } = useInboxStore();

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDue, setReminderDue] = useState("");

  // Load today's data
  const dietData = useMemo(() => {
    const diet = readDiet(todayISO);
    const totals = diet.meals.reduce(
      (acc, meal) => {
        return meal.items.reduce(
          (sum, item) => {
            const qty = item.quantity || 1;
            return {
              calories: sum.calories + item.calories * qty,
              protein: sum.protein + item.protein * qty,
              carbs: sum.carbs + item.carbs * qty,
              fat: sum.fat + item.fat * qty,
            };
          },
          acc
        );
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return { totals, goals: diet.goals };
  }, [todayISO]);

  const workoutData = useMemo(() => {
    const workout = readWorkout(todayISO);
    const exerciseCount = workout.exercises.length;
    const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const volume = workout.exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets.reduce((s, set) => {
          const avgReps = (set.repsMin + set.repsMax) / 2;
          return s + set.weight * avgReps;
        }, 0)
      );
    }, 0);
    return { exerciseCount, setCount, volume: Math.round(volume) };
  }, [todayISO]);

  const weight = readWeight(todayISO);

  const handleAddReminder = () => {
    if (reminderTitle.trim()) {
      addReminder(reminderTitle, reminderDue || undefined);
      setReminderTitle("");
      setReminderDue("");
      setShowReminderModal(false);
    }
  };

  const openDiet = () => {
    localStorage.setItem("ui-last-date-diet", todayISO);
    router.push("/diet");
  };

  const openWorkout = () => {
    localStorage.setItem("ui-last-date-workout", todayISO);
    router.push("/workout");
  };

  const openProgress = () => {
    localStorage.setItem("ui-last-date-progress", todayISO);
    router.push("/schedule");
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      {/* Header with Today badge and completion badge */}
      <header className="pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Today</h1>
          <span className="px-2 py-1 text-xs bg-accent-home text-white rounded-full">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        {isComplete && <CompletionBadge />}
      </header>

      {/* Quick actions */}
      <section className="grid grid-cols-3 gap-2">
        <button
          onClick={openProgress}
          className="tap-target rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-3 py-3 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Log Weight
        </button>
        <button
          onClick={openDiet}
          className="tap-target rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-3 py-3 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Add Meal
        </button>
        <button
          onClick={openWorkout}
          className="tap-target rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-3 py-3 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Start Workout
        </button>
      </section>

      {/* Diet summary */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Diet Summary</h2>
          <button
            onClick={openDiet}
            className="tap-target px-3 py-1.5 rounded-lg bg-accent-diet text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Open Diet
          </button>
        </div>
        <div className="flex justify-center scale-[0.85]">
          <MacroRings
            calories={{ label: "Cal", color: "var(--accent-diet)", current: Math.round(dietData.totals.calories), target: dietData.goals.cal }}
            protein={{ label: "P", color: "#F87171", current: Math.round(dietData.totals.protein), target: dietData.goals.p }}
            fat={{ label: "F", color: "var(--accent-diet-fat)", current: Math.round(dietData.totals.fat), target: dietData.goals.f }}
            carbs={{ label: "C", color: "#60A5FA", current: Math.round(dietData.totals.carbs), target: dietData.goals.c }}
          />
        </div>
      </section>

      {/* Workout snapshot */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Workout Snapshot</h2>
          <button
            onClick={openWorkout}
            className="tap-target px-3 py-1.5 rounded-lg bg-[var(--accent-workout)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Open Workout
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{workoutData.exerciseCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Exercises</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{workoutData.setCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Sets</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{workoutData.volume}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Volume (lbs)</div>
          </div>
        </div>
      </section>

      {/* Weight */}
      {weight && (
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Weight</h2>
          <div className="text-3xl font-bold">{weight.toFixed(1)} lbs</div>
        </section>
      )}

      {/* Reminders */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
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

      {/* Messages */}
      {messages.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Messages</h2>
          <ul className="space-y-2">
            {messages.slice(0, 2).map((m) => (
              <li key={m.id} className="text-sm">
                <span className="font-medium">{m.from}:</span> {m.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Alerts</h2>
          <ul className="space-y-2">
            {alerts.slice(0, 2).map((a) => (
              <li
                key={a.id}
                className={`text-sm p-2 rounded-lg ${
                  a.type === "error"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : a.type === "warn"
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}
              >
                {a.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reminder modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-xl">
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
                className="flex-1 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="flex-1 py-2 rounded-lg bg-accent-home text-white font-medium hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
