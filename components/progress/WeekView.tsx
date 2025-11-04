"use client";

import { readDiet, readWorkout, readWeight, getTodayISO } from "@/stores/storageV2";
import WeightTrendCard from "@/components/progress/WeightTrendCard";
import { getWeekRange } from "@/utils/dateHelpers";

interface WeekViewProps {
  dateISO: string;
  setDateISO: (date: string) => void;
  setView?: (view: "day" | "week" | "month" | "3months" | "year") => void;
  currentView: "day" | "week" | "month" | "3months" | "year";
}

export default function WeekView({ dateISO, setDateISO, setView, currentView }: WeekViewProps) {
  const range = getWeekRange(dateISO);
  const weekData = range.dates.map(date => {
    const diet = readDiet(date);
    const workout = readWorkout(date);
    const weight = readWeight(date);

    const dietTotal = diet.meals.reduce((acc, meal) => {
      return meal.items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), acc);
    }, 0);

    const hasWorkout = workout.exercises.length > 0;
    const hasWeight = weight !== null;
    const meetsCalories = Math.abs(dietTotal - diet.goals.cal) <= diet.goals.cal * 0.1;

    return { date, hasWorkout, hasWeight, meetsCalories, workoutSets: workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.type === "Working" || s.type === "Drop Set").length, 0) };
  });

  const totalWorkouts = weekData.filter(d => d.hasWorkout).length;
  const totalSets = weekData.reduce((sum, d) => sum + d.workoutSets, 0);
  const adherenceDays = weekData.filter(d => d.meetsCalories).length;

  // Calculate avg calories and protein
  const weekDietData = range.dates.map(date => {
    const diet = readDiet(date);
    const calories = diet.meals.reduce((acc, meal) =>
      meal.items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), acc)
    , 0);
    const protein = diet.meals.reduce((acc, meal) =>
      meal.items.reduce((sum, item) => sum + (item.protein * (item.quantity || 1)), acc)
    , 0);
    return { calories, protein, goal: diet.goals.cal };
  });

  const avgCalories = Math.round(weekDietData.reduce((sum, d) => sum + d.calories, 0) / 7);
  const avgProtein = Math.round(weekDietData.reduce((sum, d) => sum + d.protein, 0) / 7);
  const avgGoal = Math.round(weekDietData.reduce((sum, d) => sum + d.goal, 0) / 7);
  const streakDays = (() => {
    let streak = 0;
    for (const data of weekData) {
      if (data.hasWorkout || data.meetsCalories) streak++;
      else break;
    }
    return streak;
  })();

  return (
    <div className="space-y-4">
      {/* Weight Trend Card */}
      <WeightTrendCard currentView={currentView} />

      {/* Week at a glance */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-medium mb-3">Week at a Glance</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Workouts</span>
            <span className="font-medium">{totalWorkouts}/7</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Total Sets</span>
            <span className="font-medium">{totalSets}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Avg Calories</span>
            <span className="font-medium">{avgCalories}/{avgGoal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Avg Protein</span>
            <span className="font-medium">{avgProtein}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Diet Days</span>
            <span className="font-medium">{adherenceDays}/7</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500 dark:text-neutral-400">Streak</span>
            <span className="font-medium">{streakDays} days</span>
          </div>
        </div>
        {adherenceDays >= 6 && totalWorkouts >= 4 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm text-accent-progress">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-medium">All goals met this week!</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Workouts</div>
        </div>
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{totalSets}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Sets</div>
        </div>
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{adherenceDays}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Diet Days</div>
        </div>
      </div>

      {/* Week grid */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-medium mb-3">Week Overview</h2>
        <div className="grid grid-cols-7 gap-2">
          {range.dates.map((date, i) => {
            const data = weekData[i];
            // Parse date correctly to avoid timezone issues
            const [y, m, dayNum] = date.split("-").map(Number);
            const dateObj = new Date(y, m - 1, dayNum);
            const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
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
                <div className="font-medium">{dayName}</div>
                <div className="text-lg font-bold">{dayNum}</div>
                <div className="flex gap-0.5 mt-1">
                  {data.hasWorkout && <div className="w-1.5 h-1.5 rounded-full bg-accent-workout" />}
                  {data.hasWeight && <div className="w-1.5 h-1.5 rounded-full bg-accent-home" />}
                  {data.meetsCalories && <div className="w-1.5 h-1.5 rounded-full bg-accent-diet" />}
                </div>
              </button>
            );
          })}
        </div>
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
