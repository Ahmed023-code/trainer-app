"use client";

import { readDiet, readWorkout, readWeight, getTodayISO } from "@/stores/storageV2";
import { getMonthMatrix, get3MonthsMatrices } from "@/utils/dateHelpers";
import WeightTrendCard from "@/components/progress/WeightTrendCard";

interface MonthViewProps {
  dateISO: string;
  setDateISO: (date: string) => void;
  setView?: (view: "day" | "week" | "month" | "3months" | "year") => void;
  currentView: "day" | "week" | "month" | "3months" | "year";
}

export default function MonthView({ dateISO, setDateISO, setView, currentView }: MonthViewProps) {
  const is3MonthView = currentView === "3months";
  const matrices = is3MonthView ? get3MonthsMatrices(dateISO) : [{ month: "", matrix: getMonthMatrix(dateISO) }];
  const [year, month] = dateISO.split("-").map(Number);

  // Calculate monthly stats for all matrices
  const allDates = matrices.flatMap(m => m.matrix.flat().filter(d => d !== null));
  const monthData = allDates.map(date => {
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
      {/* Weight Trend Card */}
      <WeightTrendCard currentView={currentView} />

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{workoutDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Workouts</div>
        </div>
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{weightDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Weigh-ins</div>
        </div>
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{dietDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Diet Days</div>
        </div>
      </div>

      {/* Calendar grid(s) */}
      <div className="space-y-4">
        {matrices.map((monthMatrix, monthIdx) => (
          <div key={monthIdx} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
            {is3MonthView && <h2 className="font-medium mb-3">{monthMatrix.month}</h2>}
            {!is3MonthView && <h2 className="font-medium mb-3">Calendar</h2>}

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            {monthMatrix.matrix.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((date, dayIdx) => {
                  if (!date) {
                    return <div key={dayIdx} className="aspect-square" />;
                  }

                  const dayData = monthData.find(d => d.date === date);
                  // Parse date correctly to avoid timezone issues
                  const [y, m, day] = date.split("-").map(Number);
                  const isToday = date === getTodayISO();

                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setDateISO(date);
                        if (setView) setView("day");
                      }}
                      className={`aspect-square rounded-full border ${isToday ? 'border-accent-home bg-accent-home/10' : 'border-neutral-300 dark:border-neutral-700'} flex flex-col items-center justify-center text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                    >
                      <div className="font-medium">{day}</div>
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

            {monthIdx === matrices.length - 1 && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
