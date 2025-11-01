import { create } from "zustand";
import { readWorkout, readDiet, getTodayISO, toISODate } from "./storageV2";
import { isDayComplete } from "@/utils/completion";

const STORAGE_KEY = "goals-v1";

type WeeklyGoals = {
  workouts: number; // Number of workouts per week
  protein: number; // Average protein per day (grams)
  caloriesTarget?: number; // Optional average calories per day
};

type GoalsState = {
  weeklyGoals: WeeklyGoals;
  setWeeklyGoals: (goals: WeeklyGoals) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;

  // Derived data
  getWeekProgress: (weekStartISO: string) => {
    workoutsCompleted: number;
    avgProtein: number;
    avgCalories: number;
    daysLogged: number;
  };
  getCurrentStreak: () => number;
};

// Default goals
const DEFAULT_GOALS: WeeklyGoals = {
  workouts: 4,
  protein: 150,
  caloriesTarget: 2400,
};

export const useGoalsStore = create<GoalsState>((set, get) => ({
  weeklyGoals: DEFAULT_GOALS,

  setWeeklyGoals: (goals) => {
    set({ weeklyGoals: goals });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      set({ weeklyGoals: { ...DEFAULT_GOALS, ...data.weeklyGoals } });
    } catch {
      // Ignore errors
    }
  },

  saveToStorage: () => {
    try {
      const { weeklyGoals } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ weeklyGoals }));
    } catch {
      // Ignore errors
    }
  },

  getWeekProgress: (weekStartISO: string) => {
    // Get 7 days starting from weekStartISO
    const dates: string[] = [];
    const startDate = new Date(weekStartISO + "T00:00:00");

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(toISODate(d));
    }

    let workoutsCompleted = 0;
    let totalProtein = 0;
    let totalCalories = 0;
    let daysLogged = 0;

    for (const dateISO of dates) {
      const workout = readWorkout(dateISO);
      const hasWorkout = workout.exercises.some((ex) => ex.sets.length > 0);

      if (hasWorkout) {
        workoutsCompleted++;
      }

      const diet = readDiet(dateISO);
      const hasMeals = diet.meals.some((meal) => meal.items.length > 0);

      if (hasMeals) {
        daysLogged++;
        const protein = diet.meals.reduce(
          (sum, meal) => sum + meal.items.reduce((s, item) => s + item.protein, 0),
          0
        );
        const calories = diet.meals.reduce(
          (sum, meal) => sum + meal.items.reduce((s, item) => s + item.calories, 0),
          0
        );

        totalProtein += protein;
        totalCalories += calories;
      }
    }

    return {
      workoutsCompleted,
      avgProtein: daysLogged > 0 ? totalProtein / daysLogged : 0,
      avgCalories: daysLogged > 0 ? totalCalories / daysLogged : 0,
      daysLogged,
    };
  },

  getCurrentStreak: () => {
    // Calculate streak of consecutive days where all goals were met (isDayComplete)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Check backwards from today
    while (true) {
      const dateISO = toISODate(currentDate);

      // Stop if we're checking a future date
      if (currentDate > today) break;

      // Check if day is complete
      if (isDayComplete(dateISO)) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }

      // Safety: don't check more than 365 days back
      if (streak > 365) break;
    }

    return streak;
  },
}));

// Load from storage on mount
if (typeof window !== "undefined") {
  useGoalsStore.getState().loadFromStorage();
}
