"use client";

import { readDiet, readWorkout, readWeight, getTodayISO } from "@/stores/storageV2";
import { getMonthMatrix } from "@/utils/dateHelpers";

interface MonthViewProps {
  dateISO: string;
  setDateISO: (date: string) => void;
}

export default function MonthView({ dateISO, setDateISO }: MonthViewProps) {
  const matrix = getMonthMatrix(dateISO);
  const [year, month] = dateISO.split("-").map(Number);

  // Calculate monthly stats
  const monthData = matrix.flat().filter(d => d !== null).map(date => {
    const diet = readDiet(date!);
    const workout = readWorkout(date!);
    const weight = readWeight(date!);

    const dietTotal = diet.meals.reduce((acc, meal) => {
      return meal.items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), acc);
    }, 0);

    return {
      date: date!,
      hasWorkout: workout.exercises.length > 0,
      hasWeight: weight !== null,
      meetsCalories: Math.abs(dietTotal - diet.goals.cal) <= diet.goals.cal * 0.1,
    };
  });

  const workoutDays = monthData.filter(d => d.hasWorkout).length;
  const weightDays = monthData.filter(d => d.hasWeight).length;
  const dietDays = monthData.filter(d => d.meetsCalories).length;

  return (
    <div className="space-y-4">
      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{workoutDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Workouts</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{weightDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Weigh-ins</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{dietDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Diet Days</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-medium mb-3">Calendar</h2>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        {matrix.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((date, dayIdx) => {
              if (!date) {
                return <div key={dayIdx} className="aspect-square" />;
              }

              const dayData = monthData.find(d => d.date === date);
              const d = new Date(date);
              const isToday = date === getTodayISO();

              return (
                <button
                  key={date}
                  onClick={() => setDateISO(date)}
                  className={`aspect-square rounded-lg border ${isToday ? 'border-accent-home bg-accent-home/10' : 'border-neutral-300 dark:border-neutral-700'} flex flex-col items-center justify-center text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                >
                  <div className="font-medium">{d.getDate()}</div>
                  <div className="flex gap-0.5 mt-0.5">
                    {dayData?.hasWorkout && <div className="w-1 h-1 rounded-full bg-accent-workout" />}
                    {dayData?.hasWeight && <div className="w-1 h-1 rounded-full bg-accent-home" />}
                    {dayData?.meetsCalories && <div className="w-1 h-1 rounded-full bg-accent-diet" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex gap-3 justify-center mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent-workout" />
            <span>Workout</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent-home" />
            <span>Weight</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent-diet" />
            <span>Diet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
