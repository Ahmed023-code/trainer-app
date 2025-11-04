"use client";

import { useMemo } from "react";
import { useGoalsStore } from "@/stores/goalsStore";
import { getTodayISO } from "@/stores/storageV2";

// Get the start of the current week (Sunday)
function getWeekStartISO(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function GoalRingsCard() {
  const weeklyGoals = useGoalsStore((s) => s.weeklyGoals);
  const getWeekProgress = useGoalsStore((s) => s.getWeekProgress);
  const getCurrentStreak = useGoalsStore((s) => s.getCurrentStreak);

  const weekStartISO = useMemo(() => getWeekStartISO(), []);

  const progress = useMemo(() => {
    return getWeekProgress(weekStartISO);
  }, [getWeekProgress, weekStartISO]);

  const streak = useMemo(() => getCurrentStreak(), [getCurrentStreak]);

  // Calculate percentages
  const workoutPct = Math.min((progress.workoutsCompleted / weeklyGoals.workouts) * 100, 100);
  const proteinPct = Math.min((progress.avgProtein / weeklyGoals.protein) * 100, 100);
  const caloriesPct = weeklyGoals.caloriesTarget
    ? Math.min((progress.avgCalories / weeklyGoals.caloriesTarget) * 100, 100)
    : 0;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <h3 className="font-semibold mb-4">Weekly Goals</h3>

      {/* Rings */}
      <div className="flex items-center justify-around mb-4">
        <GoalRing
          label="Workouts"
          value={progress.workoutsCompleted}
          target={weeklyGoals.workouts}
          percentage={workoutPct}
          color="var(--accent-workout)"
        />
        <GoalRing
          label="Protein"
          value={Math.round(progress.avgProtein)}
          target={weeklyGoals.protein}
          percentage={proteinPct}
          color="var(--accent-diet)"
          unit="g/day"
        />
        {weeklyGoals.caloriesTarget && (
          <GoalRing
            label="Calories"
            value={Math.round(progress.avgCalories)}
            target={weeklyGoals.caloriesTarget}
            percentage={caloriesPct}
            color="var(--accent-progress)"
            unit="kcal"
          />
        )}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Current Streak</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-500">{streak}</div>
              <div className="text-sm text-neutral-500">day{streak !== 1 ? "s" : ""}</div>
            </div>
          </div>
          <div className="mt-2 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type GoalRingProps = {
  label: string;
  value: number;
  target: number;
  percentage: number;
  color: string;
  unit?: string;
};

function GoalRing({ label, value, target, percentage, color, unit }: GoalRingProps) {
  const size = 90;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-neutral-200 dark:text-neutral-800"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold leading-none">{value}</div>
          <div className="text-[10px] text-neutral-500">of {target}</div>
        </div>
      </div>
      <div className="mt-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
        {unit && <span className="text-[10px] ml-1">({unit})</span>}
      </div>
    </div>
  );
}
