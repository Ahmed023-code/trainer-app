/**
 * Mock Data Generator for Testing
 *
 * Generates a full year of sample data for:
 * - Weight logs (365 days)
 * - Diet logs (meals and macros)
 * - Workout logs (exercises and sets)
 * - Workout routines
 */

// Helper to get date strings in YYYY-MM-DD format
const getDateISO = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Helper to generate random number in range
const random = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper to generate random float in range
const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export function loadMockData() {
  console.log('Loading mock data for full year...');

  // 1. Create mock profile
  const mockProfile = {
    displayName: "Demo User",
    createdAt: new Date().toISOString(),
    isMockData: true, // Tag to identify mock data
  };
  localStorage.setItem("profile-v1", JSON.stringify(mockProfile));

  // 2. Create mock weight logs (365 days with realistic fluctuations)
  const weightData: Record<string, number> = {};
  let baseWeight = 190; // Starting weight
  const targetWeight = 175; // Target after 1 year
  const totalDays = 365;
  const weightLossPerDay = (baseWeight - targetWeight) / totalDays;

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);

    // Skip some days randomly (90% logged, 10% missed)
    if (Math.random() < 0.1) continue;

    // Gradual downward trend with realistic daily fluctuation
    baseWeight -= weightLossPerDay;
    const dailyVariation = randomFloat(-1.5, 1.5); // ±1.5 lbs daily variation
    const weeklyPattern = Math.sin((i % 7) / 7 * Math.PI * 2) * 0.5; // Weekly water weight pattern

    weightData[dateISO] = Math.round((baseWeight + dailyVariation + weeklyPattern) * 10) / 10;
  }
  localStorage.setItem("progress-weight-by-day-v1", JSON.stringify(weightData));

  // 3. Create mock diet logs (full year, ~80% logged)
  const dietData: Record<string, any> = {};
  const mealTemplates = [
    {
      name: "Breakfast",
      items: [
        { name: "Oatmeal", quantity: 1, calories: 300, protein: 10, carbs: 54, fat: 6 },
        { name: "Banana", quantity: 1, calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: "Protein Shake", quantity: 1, calories: 120, protein: 24, carbs: 3, fat: 2 },
      ],
    },
    {
      name: "Lunch",
      items: [
        { name: "Grilled Chicken Breast", quantity: 6, calories: 250, protein: 46, carbs: 0, fat: 6 },
        { name: "Brown Rice", quantity: 1, calories: 215, protein: 5, carbs: 45, fat: 2 },
        { name: "Broccoli", quantity: 1, calories: 55, protein: 4, carbs: 11, fat: 1 },
      ],
    },
    {
      name: "Snack",
      items: [
        { name: "Greek Yogurt", quantity: 1, calories: 130, protein: 15, carbs: 15, fat: 3 },
        { name: "Almonds", quantity: 1, calories: 160, protein: 6, carbs: 6, fat: 14 },
      ],
    },
    {
      name: "Dinner",
      items: [
        { name: "Salmon Fillet", quantity: 6, calories: 280, protein: 40, carbs: 0, fat: 13 },
        { name: "Sweet Potato", quantity: 1, calories: 180, protein: 4, carbs: 41, fat: 0 },
        { name: "Green Beans", quantity: 1, calories: 44, protein: 2, carbs: 10, fat: 0 },
      ],
    },
    {
      name: "Post-Workout",
      items: [
        { name: "Protein Shake", quantity: 1, calories: 120, protein: 24, carbs: 3, fat: 2 },
        { name: "Rice Cakes", quantity: 2, calories: 70, protein: 1, carbs: 15, fat: 0 },
      ],
    },
  ];

  // Additional meal variations for variety
  const lunchVariations = [
    [
      { name: "Turkey Sandwich", quantity: 1, calories: 350, protein: 30, carbs: 42, fat: 8 },
      { name: "Apple", quantity: 1, calories: 95, protein: 0, carbs: 25, fat: 0 },
    ],
    [
      { name: "Tuna Salad", quantity: 1, calories: 280, protein: 35, carbs: 12, fat: 11 },
      { name: "Whole Wheat Crackers", quantity: 10, calories: 120, protein: 3, carbs: 20, fat: 3 },
    ],
  ];

  const dinnerVariations = [
    [
      { name: "Steak", quantity: 8, calories: 380, protein: 48, carbs: 0, fat: 20 },
      { name: "Baked Potato", quantity: 1, calories: 160, protein: 4, carbs: 37, fat: 0 },
      { name: "Asparagus", quantity: 1, calories: 40, protein: 4, carbs: 8, fat: 0 },
    ],
    [
      { name: "Ground Turkey", quantity: 6, calories: 240, protein: 36, carbs: 0, fat: 10 },
      { name: "Pasta", quantity: 2, calories: 220, protein: 8, carbs: 43, fat: 1 },
      { name: "Marinara Sauce", quantity: 1, calories: 70, protein: 2, carbs: 12, fat: 2 },
    ],
  ];

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);

    // Skip some days randomly (80% logged, 20% missed)
    if (Math.random() < 0.2) continue;

    const numMeals = random(2, 4);
    const meals = [];

    // Always include breakfast
    if (numMeals >= 1) {
      meals.push(mealTemplates[0]);
    }

    // Add lunch (with variation)
    if (numMeals >= 2) {
      if (Math.random() < 0.3 && lunchVariations.length > 0) {
        const variation = lunchVariations[random(0, lunchVariations.length - 1)];
        meals.push({ name: "Lunch", items: variation });
      } else {
        meals.push(mealTemplates[1]);
      }
    }

    // Add snack
    if (numMeals >= 3) {
      meals.push(mealTemplates[2]);
    }

    // Add dinner (with variation)
    if (numMeals >= 4) {
      if (Math.random() < 0.3 && dinnerVariations.length > 0) {
        const variation = dinnerVariations[random(0, dinnerVariations.length - 1)];
        meals.push({ name: "Dinner", items: variation });
      } else {
        meals.push(mealTemplates[3]);
      }
    }

    dietData[dateISO] = {
      meals: meals,
      goals: {
        cal: 2400,
        p: 180,
        c: 250,
        f: 60,
      },
    };
  }
  localStorage.setItem("diet-by-day-v2", JSON.stringify(dietData));

  // 4. Create mock workout logs (full year, 4-5 workouts per week with progressive overload)
  const workoutData: Record<string, any> = {};

  // Base exercise templates with starting weights
  const createPushExercises = (weekNumber: number) => {
    // Progressive overload: +2.5 lbs every 3 weeks
    const progressMultiplier = Math.floor(weekNumber / 3) * 2.5;

    return [
      {
        name: "Barbell Bench Press",
        sets: [
          { weight: 135, repsMin: 12, repsMax: 15, rpe: 6, type: "Warmup", repsPerformed: random(12, 15) },
          { weight: 185 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 185 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 185 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add",
      },
      {
        name: "Incline Dumbbell Press",
        sets: [
          { weight: 60 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 60 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 60 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add",
      },
      {
        name: "Overhead Press",
        sets: [
          { weight: 95 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 95 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 95 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add",
      },
    ];
  };

  const createPullExercises = (weekNumber: number) => {
    const progressMultiplier = Math.floor(weekNumber / 3) * 2.5;

    return [
      {
        name: "Barbell Row",
        sets: [
          { weight: 135 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 135 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 135 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add",
      },
      {
        name: "Lat Pulldown",
        sets: [
          { weight: 120 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 120 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 120 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add",
      },
      {
        name: "Cable Row",
        sets: [
          { weight: 110 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 110 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add",
      },
    ];
  };

  const createLegExercises = (weekNumber: number) => {
    const progressMultiplier = Math.floor(weekNumber / 3) * 2.5;

    return [
      {
        name: "Barbell Squat",
        sets: [
          { weight: 135, repsMin: 10, repsMax: 12, rpe: 6, type: "Warmup", repsPerformed: random(10, 12) },
          { weight: 225 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 225 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 225 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add",
      },
      {
        name: "Romanian Deadlift",
        sets: [
          { weight: 185 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 185 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 185 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add",
      },
      {
        name: "Leg Press",
        sets: [
          { weight: 360 + progressMultiplier * 4, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 360 + progressMultiplier * 4, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add",
      },
    ];
  };

  const workoutNotes = [
    "Felt strong today!",
    "Good pump, hit all targets",
    "Tired but got it done",
    "Great session",
    "New PR on top set!",
    "Solid workout",
    "Felt a bit sluggish but finished",
    "Best workout this week",
  ];

  // Generate workouts: Push/Pull/Legs split, 4-5 days per week
  let daysSinceLastWorkout = 0;
  let workoutRotation = 0; // 0 = Push, 1 = Pull, 2 = Legs

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);
    const weekNumber = Math.floor((totalDays - i) / 7);

    daysSinceLastWorkout++;

    // Workout frequency: rest day if worked out yesterday, or random rest (20% chance)
    const shouldRest = daysSinceLastWorkout < 2 || Math.random() < 0.25;

    if (shouldRest) {
      continue; // Skip this day
    }

    // Create workout based on rotation
    let exercises;
    let workoutType;

    if (workoutRotation === 0) {
      exercises = createPushExercises(weekNumber);
      workoutType = "Push Day";
    } else if (workoutRotation === 1) {
      exercises = createPullExercises(weekNumber);
      workoutType = "Pull Day";
    } else {
      exercises = createLegExercises(weekNumber);
      workoutType = "Leg Day";
    }

    workoutData[dateISO] = {
      exercises: exercises,
      notes: `${workoutType} - ${workoutNotes[random(0, workoutNotes.length - 1)]}`,
    };

    // Advance rotation
    workoutRotation = (workoutRotation + 1) % 3;
    daysSinceLastWorkout = 0;
  }

  localStorage.setItem("workout-by-day-v2", JSON.stringify(workoutData));

  // 5. Create mock workout routines
  const routines = [
    {
      id: "routine-mock-1",
      name: "Push Day (Chest/Shoulders/Triceps)",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { weight: 135, repsMin: 12, repsMax: 15, rpe: 6, type: "Warmup" },
            { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "Focus on controlled descent",
        },
        {
          name: "Incline Dumbbell Press",
          sets: [
            { weight: 60, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 60, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 60, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Overhead Press",
          sets: [
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
    {
      id: "routine-mock-2",
      name: "Pull Day (Back/Biceps)",
      exercises: [
        {
          name: "Barbell Row",
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Lat Pulldown",
          sets: [
            { weight: 120, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 120, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 120, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Cable Row",
          sets: [
            { weight: 110, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 110, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
    {
      id: "routine-mock-3",
      name: "Leg Day",
      exercises: [
        {
          name: "Barbell Squat",
          sets: [
            { weight: 135, repsMin: 10, repsMax: 12, rpe: 6, type: "Warmup" },
            { weight: 225, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 225, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 225, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Romanian Deadlift",
          sets: [
            { weight: 185, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Leg Press",
          sets: [
            { weight: 360, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 360, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
  ];
  localStorage.setItem("workout-routines-v1", JSON.stringify(routines));

  // 6. Initialize empty media index
  localStorage.setItem("progress-media-index-v1", JSON.stringify({}));

  // Count generated data
  const weightDays = Object.keys(weightData).length;
  const dietDays = Object.keys(dietData).length;
  const workoutDays = Object.keys(workoutData).length;

  console.log('Mock data loaded successfully!');
  console.log('- Profile: Demo User (tagged as mock)');
  console.log(`- Weight logs: ${weightDays} days (~${Math.round(weightDays/365*100)}% of year)`);
  console.log(`- Diet logs: ${dietDays} days (~${Math.round(dietDays/365*100)}% of year)`);
  console.log(`- Workout logs: ${workoutDays} sessions (~${Math.round(workoutDays/52)} per week average)`);
  console.log('- Routines: 3 workout templates (Push/Pull/Legs)');
  console.log('- Progressive overload: weights increase every 3 weeks');

  return true;
}

export function clearMockData() {
  // Remove all mock data by clearing relevant localStorage keys
  const keysToRemove = [
    "profile-v1",
    "progress-weight-by-day-v1",
    "progress-media-index-v1",
    "diet-by-day-v2",
    "workout-by-day-v2",
    "workout-routines-v1",
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('Mock data cleared!');
}

export function isMockDataLoaded(): boolean {
  try {
    const profile = localStorage.getItem("profile-v1");
    if (!profile) return false;
    const data = JSON.parse(profile);
    return data.isMockData === true;
  } catch {
    return false;
  }
}
