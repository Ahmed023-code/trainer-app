/**
 * UI SANDBOX - Mock In-Memory Storage
 *
 * This file replaces localStorage with in-memory storage pre-populated with realistic mock data.
 * Used in UI sandbox mode for design experiments without needing real backend.
 */

import type { DietDayState, WorkoutDayState, Goals, Meal, Exercise } from './storageV2';

// In-memory storage objects
let mockLocalStorage: Record<string, string> = {};
let mockIndexedDB: Record<string, any> = {};

// Helper to get date strings in YYYY-MM-DD format
const getDateISO = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initialize mock data
export function initializeMockData() {
  console.log('[UI Sandbox] Initializing mock data...');

  // 1. Profile data
  mockLocalStorage['profile-v1'] = JSON.stringify({
    displayName: 'UI Sandbox User',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    isMockData: true,
  });

  // 2. Weight data - last 90 days with realistic progression
  const weightData: Record<string, number> = {};
  let baseWeight = 185;
  for (let i = 89; i >= 0; i--) {
    const dateISO = getDateISO(i);
    // Gradual weight loss with daily fluctuations
    const progress = (89 - i) / 89;
    const trend = baseWeight - (progress * 5); // Lost 5 lbs over 90 days
    const daily = (Math.random() - 0.5) * 2; // ±1 lb daily variation
    weightData[dateISO] = Math.round((trend + daily) * 10) / 10;
  }
  mockLocalStorage['progress-weight-by-day-v1'] = JSON.stringify(weightData);

  // 3. Default diet goals
  const defaultGoals: Goals = { cal: 2400, p: 180, c: 240, f: 70 };
  mockLocalStorage['diet-default-goals-v2'] = JSON.stringify(defaultGoals);

  // 4. Diet data - last 30 days with varied realistic meals
  const dietData: Record<string, DietDayState> = {};

  const breakfasts: Meal[] = [
    {
      name: 'Breakfast',
      items: [
        { name: 'Oatmeal with Protein', quantity: 1, calories: 350, protein: 25, carbs: 45, fat: 8 },
        { name: 'Banana', quantity: 1, calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: 'Almond Butter', quantity: 1, calories: 98, protein: 3, carbs: 3, fat: 9 },
      ],
    },
    {
      name: 'Breakfast',
      items: [
        { name: 'Egg White Scramble', quantity: 1, calories: 200, protein: 30, carbs: 5, fat: 5 },
        { name: 'Whole Wheat Toast', quantity: 2, calories: 160, protein: 8, carbs: 30, fat: 2 },
        { name: 'Avocado', quantity: 0.5, calories: 120, protein: 1, carbs: 6, fat: 11 },
      ],
    },
  ];

  const lunches: Meal[] = [
    {
      name: 'Lunch',
      items: [
        { name: 'Grilled Chicken Breast', quantity: 1, calories: 280, protein: 52, carbs: 0, fat: 6 },
        { name: 'Brown Rice', quantity: 1, calories: 215, protein: 5, carbs: 45, fat: 2 },
        { name: 'Mixed Vegetables', quantity: 1, calories: 80, protein: 3, carbs: 15, fat: 1 },
      ],
    },
    {
      name: 'Lunch',
      items: [
        { name: 'Turkey Sandwich', quantity: 1, calories: 450, protein: 35, carbs: 48, fat: 12 },
        { name: 'Greek Yogurt', quantity: 1, calories: 150, protein: 20, carbs: 10, fat: 4 },
      ],
    },
  ];

  const dinners: Meal[] = [
    {
      name: 'Dinner',
      items: [
        { name: 'Salmon Fillet', quantity: 1, calories: 350, protein: 42, carbs: 0, fat: 18 },
        { name: 'Sweet Potato', quantity: 1, calories: 180, protein: 4, carbs: 41, fat: 0 },
        { name: 'Broccoli', quantity: 1, calories: 55, protein: 4, carbs: 11, fat: 1 },
      ],
    },
    {
      name: 'Dinner',
      items: [
        { name: 'Lean Beef', quantity: 1, calories: 310, protein: 48, carbs: 0, fat: 12 },
        { name: 'Pasta', quantity: 1, calories: 200, protein: 7, carbs: 40, fat: 1 },
        { name: 'Marinara Sauce', quantity: 1, calories: 70, protein: 2, carbs: 12, fat: 2 },
      ],
    },
  ];

  const snacks: Meal[] = [
    {
      name: 'Snacks',
      items: [
        { name: 'Protein Shake', quantity: 1, calories: 220, protein: 40, carbs: 8, fat: 3 },
        { name: 'Apple', quantity: 1, calories: 95, protein: 0, carbs: 25, fat: 0 },
      ],
    },
    {
      name: 'Snacks',
      items: [
        { name: 'Greek Yogurt', quantity: 1, calories: 150, protein: 20, carbs: 10, fat: 4 },
        { name: 'Mixed Nuts', quantity: 1, calories: 170, protein: 6, carbs: 6, fat: 15 },
      ],
    },
  ];

  for (let i = 29; i >= 0; i--) {
    const dateISO = getDateISO(i);
    const randomBreakfast = breakfasts[i % breakfasts.length];
    const randomLunch = lunches[i % lunches.length];
    const randomDinner = dinners[i % dinners.length];
    const randomSnack = snacks[i % snacks.length];

    dietData[dateISO] = {
      meals: [randomBreakfast, randomLunch, randomDinner, randomSnack],
      goals: defaultGoals,
    };
  }
  mockLocalStorage['diet-by-day-v2'] = JSON.stringify(dietData);

  // 5. Workout data - last 30 days with realistic exercises
  const workoutData: Record<string, WorkoutDayState> = {};

  const workoutTemplates = [
    {
      name: 'Push Day',
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 7, type: 'Warmup' as const },
            { weight: 185, repsMin: 6, repsMax: 8, rpe: 8, type: 'Working' as const },
            { weight: 185, repsMin: 6, repsMax: 8, rpe: 8, type: 'Working' as const },
            { weight: 185, repsMin: 6, repsMax: 8, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
        {
          name: 'Overhead Press',
          sets: [
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working' as const },
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working' as const },
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
        {
          name: 'Incline Dumbbell Press',
          sets: [
            { weight: 60, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working' as const },
            { weight: 60, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working' as const },
            { weight: 60, repsMin: 10, repsMax: 12, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
      ],
    },
    {
      name: 'Pull Day',
      exercises: [
        {
          name: 'Deadlift',
          sets: [
            { weight: 135, repsMin: 5, repsMax: 5, rpe: 6, type: 'Warmup' as const },
            { weight: 225, repsMin: 5, repsMax: 5, rpe: 8, type: 'Working' as const },
            { weight: 225, repsMin: 5, repsMax: 5, rpe: 8, type: 'Working' as const },
            { weight: 225, repsMin: 5, repsMax: 5, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
        {
          name: 'Pull-ups',
          sets: [
            { weight: 0, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working' as const },
            { weight: 0, repsMin: 8, repsMax: 10, rpe: 9, type: 'Working' as const },
            { weight: 0, repsMin: 8, repsMax: 10, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
        {
          name: 'Barbell Rows',
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working' as const },
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working' as const },
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
      ],
    },
    {
      name: 'Leg Day',
      exercises: [
        {
          name: 'Squat',
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 6, type: 'Warmup' as const },
            { weight: 225, repsMin: 6, repsMax: 8, rpe: 8, type: 'Working' as const },
            { weight: 225, repsMin: 6, repsMax: 8, rpe: 8, type: 'Working' as const },
            { weight: 225, repsMin: 6, repsMax: 8, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
        {
          name: 'Romanian Deadlift',
          sets: [
            { weight: 135, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working' as const },
            { weight: 135, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working' as const },
            { weight: 135, repsMin: 10, repsMax: 12, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
        {
          name: 'Leg Press',
          sets: [
            { weight: 270, repsMin: 12, repsMax: 15, rpe: 8, type: 'Working' as const },
            { weight: 270, repsMin: 12, repsMax: 15, rpe: 9, type: 'Working' as const },
          ],
          notes: '',
        },
      ],
    },
  ];

  // Populate last 30 days with workouts (skip some days for rest)
  let templateIndex = 0;
  for (let i = 29; i >= 0; i--) {
    // Workout every other day (rest days)
    if (i % 2 === 0) {
      const dateISO = getDateISO(i);
      const template = workoutTemplates[templateIndex % workoutTemplates.length];
      workoutData[dateISO] = {
        exercises: template.exercises.map(ex => ({ ...ex })),
        notes: '',
      };
      templateIndex++;
    }
  }
  mockLocalStorage['workout-by-day-v2'] = JSON.stringify(workoutData);

  // 6. Settings
  mockLocalStorage['settings-v1'] = JSON.stringify({
    weightUnit: 'lbs',
    theme: 'system',
    notifications: true,
  });

  // 7. Inbox/reminders
  mockLocalStorage['inbox-reminders'] = JSON.stringify([
    {
      id: '1',
      title: 'Buy more protein powder',
      done: false,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: '2',
      title: 'Schedule deload week',
      done: false,
      dueISO: getDateISO(-7), // Due in 7 days
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    },
  ]);

  console.log('[UI Sandbox] Mock data initialized successfully!');
  console.log(`[UI Sandbox] - ${Object.keys(weightData).length} days of weight data`);
  console.log(`[UI Sandbox] - ${Object.keys(dietData).length} days of diet data`);
  console.log(`[UI Sandbox] - ${Object.keys(workoutData).length} days of workout data`);
}

// Mock localStorage API
export const mockLocalStorageAPI = {
  getItem(key: string): string | null {
    return mockLocalStorage[key] || null;
  },
  setItem(key: string, value: string): void {
    mockLocalStorage[key] = value;
  },
  removeItem(key: string): void {
    delete mockLocalStorage[key];
  },
  clear(): void {
    mockLocalStorage = {};
  },
};

// Mock IndexedDB API (simplified for idb-keyval compatibility)
export const mockIdbKeyval = {
  get: async (key: string) => {
    return mockIndexedDB[key];
  },
  set: async (key: string, value: any) => {
    mockIndexedDB[key] = value;
  },
  del: async (key: string) => {
    delete mockIndexedDB[key];
  },
};

// Initialize on import
if (typeof window !== 'undefined') {
  initializeMockData();
}
