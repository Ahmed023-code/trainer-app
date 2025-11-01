"use client";

import { readDiet, readWorkout } from "@/stores/storageV2";

interface YearViewProps {
  dateISO: string;
  setDateISO: (date: string) => void;
}

export default function YearView({ dateISO, setDateISO }: YearViewProps) {
  const [year] = dateISO.split("-").map(Number);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const yearData = months.map(m => {
    const monthStr = String(m).padStart(2, '0');
    const daysInMonth = new Date(year, m, 0).getDate();

    let workoutCount = 0;
    let totalCalories = 0;
    let totalGoals = 0;
    let daysWithData = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
      const diet = readDiet(date);
      const workout = readWorkout(date);

      if (workout.exercises.length > 0) workoutCount++;

      const dayCalories = diet.meals.reduce((acc, meal) => {
        return meal.items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), acc);
      }, 0);

      if (dayCalories > 0) {
        totalCalories += dayCalories;
        totalGoals += diet.goals.cal;
        daysWithData++;
      }
    }

    const avgAdherence = daysWithData > 0 ? Math.round((totalCalories / totalGoals) * 100) : 0;

    return {
      month: m,
      workoutCount,
      avgAdherence,
    };
  });

  const totalWorkouts = yearData.reduce((sum, m) => sum + m.workoutCount, 0);
  const avgYearAdherence = Math.round(yearData.reduce((sum, m) => sum + m.avgAdherence, 0) / 12);

  return (
    <div className="space-y-4">
      {/* Year summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Workouts</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{avgYearAdherence}%</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Avg Adherence</div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-medium mb-3">Monthly Breakdown</h2>
        <div className="space-y-2">
          {yearData.map(({ month, workoutCount, avgAdherence }) => {
            const monthName = new Date(year, month - 1).toLocaleDateString(undefined, { month: 'long' });

            return (
              <button
                key={month}
                onClick={() => setDateISO(`${year}-${String(month).padStart(2, '0')}-01`)}
                className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{monthName}</span>
                  <div className="flex gap-3 text-sm">
                    <span className="text-accent-workout">{workoutCount} workouts</span>
                    <span className="text-accent-diet">{avgAdherence}% diet</span>
                  </div>
                </div>

                {/* Workout frequency bar */}
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-accent-workout transition-all"
                    style={{ width: `${Math.min((workoutCount / 20) * 100, 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
