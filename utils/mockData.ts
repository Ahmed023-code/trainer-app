/**
 * Mock Data Generator for Testing - 1.5 Years
 *
 * Generates 1.5 years (547 days) of sample data for:
 * - Weight logs with realistic fluctuations
 * - Diet logs with USDA food units and quantities
 * - Workout logs with progressive overload and repsPerformed
 * - Workout routines with proper exercise source tracking
 * - Meal templates for quick meal logging
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
  console.log('Loading comprehensive mock data for 1.5 years...');

  // 1. Create mock profile
  const mockProfile = {
    displayName: "Demo User",
    createdAt: new Date(Date.now() - 547 * 24 * 60 * 60 * 1000).toISOString(),
    isMockData: true,
  };
  localStorage.setItem("profile-v1", JSON.stringify(mockProfile));

  // 2. Create mock weight logs (1.5 years = 547 days with realistic fluctuations)
  const weightData: Record<string, number> = {};
  let baseWeight = 205; // Starting weight 1.5 years ago
  const targetWeight = 175; // Current target weight
  const totalDays = 547;
  const weightLossPerDay = (baseWeight - targetWeight) / totalDays;

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);

    // Skip some days randomly (85% logged, 15% missed)
    if (Math.random() < 0.15) continue;

    // Gradual downward trend with realistic daily fluctuation
    baseWeight -= weightLossPerDay;
    const dailyVariation = randomFloat(-1.8, 1.8); // ±1.8 lbs daily variation
    const weeklyPattern = Math.sin((i % 7) / 7 * Math.PI * 2) * 0.8; // Weekly water weight pattern
    const monthlyPattern = Math.sin((i % 30) / 30 * Math.PI * 2) * 0.5; // Monthly hormonal pattern

    weightData[dateISO] = Math.round((baseWeight + dailyVariation + weeklyPattern + monthlyPattern) * 10) / 10;
  }
  localStorage.setItem("progress-weight-by-day-v1", JSON.stringify(weightData));

  // 3. Create mock diet logs with proper units (1.5 years, ~75% logged)
  const dietData: Record<string, any> = {};

  // Realistic meal templates with USDA units
  const mealTemplates = [
    {
      name: "Breakfast",
      items: [
        { name: "Oatmeal, Dry", quantity: 80, unit: "g", calories: 300, protein: 10, carbs: 54, fat: 6 },
        { name: "Banana, Medium", quantity: 1, unit: "fruit (118g)", calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: "Whey Protein Isolate", quantity: 30, unit: "g", calories: 120, protein: 24, carbs: 3, fat: 2 },
        { name: "Almond Milk, Unsweetened", quantity: 240, unit: "ml", calories: 30, protein: 1, carbs: 1, fat: 2.5 },
      ],
    },
    {
      name: "Lunch",
      items: [
        { name: "Chicken Breast, Grilled", quantity: 170, unit: "g", calories: 280, protein: 53, carbs: 0, fat: 6 },
        { name: "Brown Rice, Cooked", quantity: 195, unit: "g", calories: 215, protein: 5, carbs: 45, fat: 2 },
        { name: "Broccoli, Steamed", quantity: 156, unit: "g", calories: 55, protein: 4, carbs: 11, fat: 1 },
        { name: "Olive Oil", quantity: 1, unit: "tbsp (13.5g)", calories: 120, protein: 0, carbs: 0, fat: 14 },
      ],
    },
    {
      name: "Snack",
      items: [
        { name: "Greek Yogurt, Nonfat Plain", quantity: 170, unit: "g", calories: 100, protein: 17, carbs: 7, fat: 0 },
        { name: "Blueberries, Fresh", quantity: 75, unit: "g", calories: 43, protein: 1, carbs: 11, fat: 0 },
        { name: "Almonds, Raw", quantity: 28, unit: "g (23 almonds)", calories: 160, protein: 6, carbs: 6, fat: 14 },
      ],
    },
    {
      name: "Dinner",
      items: [
        { name: "Salmon, Atlantic, Cooked", quantity: 150, unit: "g", calories: 280, protein: 40, carbs: 0, fat: 13 },
        { name: "Sweet Potato, Baked", quantity: 130, unit: "g (1 medium)", calories: 112, protein: 2, carbs: 26, fat: 0 },
        { name: "Green Beans, Steamed", quantity: 125, unit: "g", calories: 44, protein: 2, carbs: 10, fat: 0 },
        { name: "Avocado", quantity: 50, unit: "g (1/3 fruit)", calories: 80, protein: 1, carbs: 4, fat: 7 },
      ],
    },
    {
      name: "Post-Workout",
      items: [
        { name: "Whey Protein Isolate", quantity: 30, unit: "g", calories: 120, protein: 24, carbs: 3, fat: 2 },
        { name: "Rice Cakes, Plain", quantity: 18, unit: "g (2 cakes)", calories: 70, protein: 1, carbs: 15, fat: 0 },
        { name: "Banana, Medium", quantity: 1, unit: "fruit (118g)", calories: 105, protein: 1, carbs: 27, fat: 0 },
      ],
    },
  ];

  // Additional meal variations
  const breakfastVariations = [
    [
      { name: "Eggs, Whole, Scrambled", quantity: 3, unit: "large eggs (150g)", calories: 270, protein: 18, carbs: 2, fat: 20 },
      { name: "Whole Wheat Toast", quantity: 2, unit: "slices (56g)", calories: 140, protein: 8, carbs: 24, fat: 2 },
      { name: "Avocado", quantity: 50, unit: "g (1/3 fruit)", calories: 80, protein: 1, carbs: 4, fat: 7 },
    ],
    [
      { name: "Greek Yogurt, Nonfat Plain", quantity: 227, unit: "g (1 cup)", calories: 130, protein: 23, carbs: 9, fat: 0 },
      { name: "Granola, Low Fat", quantity: 30, unit: "g", calories: 120, protein: 3, carbs: 24, fat: 2 },
      { name: "Strawberries, Fresh", quantity: 150, unit: "g (1 cup)", calories: 48, protein: 1, carbs: 12, fat: 0 },
    ],
  ];

  const lunchVariations = [
    [
      { name: "Turkey Breast, Deli Sliced", quantity: 112, unit: "g (4 oz)", calories: 120, protein: 24, carbs: 4, fat: 2 },
      { name: "Whole Wheat Bread", quantity: 2, unit: "slices (56g)", calories: 140, protein: 8, carbs: 24, fat: 2 },
      { name: "Apple, Medium", quantity: 1, unit: "fruit (182g)", calories: 95, protein: 0, carbs: 25, fat: 0 },
      { name: "Baby Carrots", quantity: 85, unit: "g (10 carrots)", calories: 35, protein: 1, carbs: 8, fat: 0 },
    ],
    [
      { name: "Tuna, Canned in Water", quantity: 140, unit: "g (1 can)", calories: 150, protein: 35, carbs: 0, fat: 1 },
      { name: "Mixed Greens Salad", quantity: 85, unit: "g (3 cups)", calories: 20, protein: 2, carbs: 4, fat: 0 },
      { name: "Balsamic Vinaigrette", quantity: 2, unit: "tbsp (30ml)", calories: 90, protein: 0, carbs: 4, fat: 8 },
      { name: "Whole Wheat Crackers", quantity: 28, unit: "g (10 crackers)", calories: 120, protein: 3, carbs: 20, fat: 3 },
    ],
  ];

  const dinnerVariations = [
    [
      { name: "Sirloin Steak, Grilled", quantity: 170, unit: "g (6 oz)", calories: 340, protein: 46, carbs: 0, fat: 16 },
      { name: "Baked Potato with Skin", quantity: 173, unit: "g (1 medium)", calories: 161, protein: 4, carbs: 37, fat: 0 },
      { name: "Asparagus, Grilled", quantity: 134, unit: "g (5 spears)", calories: 27, protein: 3, carbs: 5, fat: 0 },
      { name: "Butter", quantity: 1, unit: "tbsp (14g)", calories: 100, protein: 0, carbs: 0, fat: 11 },
    ],
    [
      { name: "Ground Turkey, 93% Lean", quantity: 112, unit: "g (4 oz)", calories: 170, protein: 22, carbs: 0, fat: 8 },
      { name: "Whole Wheat Pasta, Cooked", quantity: 140, unit: "g (1 cup)", calories: 174, protein: 7, carbs: 37, fat: 1 },
      { name: "Marinara Sauce, Low Sodium", quantity: 125, unit: "g (1/2 cup)", calories: 70, protein: 2, carbs: 12, fat: 2 },
      { name: "Parmesan Cheese, Grated", quantity: 5, unit: "g (1 tbsp)", calories: 22, protein: 2, carbs: 0, fat: 1.5 },
    ],
    [
      { name: "Cod Fillet, Baked", quantity: 140, unit: "g (5 oz)", calories: 140, protein: 30, carbs: 0, fat: 1 },
      { name: "Quinoa, Cooked", quantity: 185, unit: "g (1 cup)", calories: 222, protein: 8, carbs: 39, fat: 4 },
      { name: "Brussels Sprouts, Roasted", quantity: 156, unit: "g (1 cup)", calories: 56, protein: 4, carbs: 11, fat: 1 },
    ],
  ];

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);

    // Skip some days randomly (75% logged, 25% missed)
    if (Math.random() < 0.25) continue;

    const numMeals = random(3, 5);
    const meals = [];

    // Always include breakfast (with occasional variation)
    if (Math.random() < 0.25 && breakfastVariations.length > 0) {
      const variation = breakfastVariations[random(0, breakfastVariations.length - 1)];
      meals.push({ name: "Breakfast", items: variation });
    } else {
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
      if (Math.random() < 0.35 && dinnerVariations.length > 0) {
        const variation = dinnerVariations[random(0, dinnerVariations.length - 1)];
        meals.push({ name: "Dinner", items: variation });
      } else {
        meals.push(mealTemplates[3]);
      }
    }

    // Add post-workout meal (30% chance on workout days - we'll determine this randomly)
    if (numMeals >= 5 && Math.random() < 0.3) {
      meals.push(mealTemplates[4]);
    }

    dietData[dateISO] = {
      meals: meals,
      goals: {
        cal: 2400,
        p: 180,
        c: 240,
        f: 65,
      },
    };
  }
  localStorage.setItem("diet-by-day-v2", JSON.stringify(dietData));

  // 4. Create mock workout logs with progressive overload and repsPerformed
  const workoutData: Record<string, any> = {};

  // Enhanced exercise templates with progressive overload
  const createPushExercises = (weekNumber: number) => {
    const progressMultiplier = Math.floor(weekNumber / 3) * 2.5;

    return [
      {
        name: "Barbell Bench Press",
        sets: [
          { weight: 135, repsMin: 12, repsMax: 15, rpe: 6, type: "Warmup", repsPerformed: random(13, 15) },
          { weight: 185 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 185 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 185 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
        notes: weekNumber % 4 === 0 ? "Increased weight today!" : "",
      },
      {
        name: "Incline Dumbbell Press",
        sets: [
          { weight: 60 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 60 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 60 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Overhead Press",
        sets: [
          { weight: 95 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 95 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 95 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Tricep Pushdown",
        sets: [
          { weight: 70 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 70 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
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
        source: "quick-add" as const,
        notes: weekNumber % 4 === 0 ? "Form felt great today" : "",
      },
      {
        name: "Lat Pulldown",
        sets: [
          { weight: 120 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 120 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 120 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Cable Row",
        sets: [
          { weight: 110 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 110 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Hammer Curl",
        sets: [
          { weight: 35 + progressMultiplier * 0.3, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 35 + progressMultiplier * 0.3, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
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
        source: "quick-add" as const,
        notes: weekNumber % 5 === 0 ? "Hit new PR!" : "",
      },
      {
        name: "Romanian Deadlift",
        sets: [
          { weight: 185 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 185 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 185 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Leg Press",
        sets: [
          { weight: 360 + progressMultiplier * 4, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 360 + progressMultiplier * 4, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Leg Curl",
        sets: [
          { weight: 90 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 90 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
    ];
  };

  const workoutNotes = [
    "Felt strong today! Great session.",
    "Good pump, hit all targets",
    "Tired but got it done",
    "Excellent workout",
    "New PR on compound lift!",
    "Solid session, feeling good",
    "Felt a bit sluggish but finished strong",
    "Best workout this week",
    "Increased weight on all sets",
    "Focus on form today, felt great",
  ];

  // Generate workouts: Push/Pull/Legs split, 4-5 days per week
  let daysSinceLastWorkout = 0;
  let workoutRotation = 0; // 0 = Push, 1 = Pull, 2 = Legs

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);
    const weekNumber = Math.floor((totalDays - i) / 7);

    daysSinceLastWorkout++;

    // Workout frequency: rest day if worked out yesterday, or random rest (30% chance)
    const shouldRest = daysSinceLastWorkout < 2 || Math.random() < 0.3;

    if (shouldRest) {
      continue;
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

  // 5. Create comprehensive workout routines
  const routines = [
    {
      id: "routine-mock-1",
      name: "Push Day (Chest/Shoulders/Triceps)",
      emoji: "💪",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { weight: 135, repsMin: 12, repsMax: 15, rpe: 6, type: "Warmup" },
            { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "Focus on controlled descent, pause at chest",
        },
        {
          name: "Incline Dumbbell Press",
          sets: [
            { weight: 60, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 60, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 60, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "30-45 degree incline",
        },
        {
          name: "Overhead Press",
          sets: [
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 95, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Tricep Pushdown",
          sets: [
            { weight: 70, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 70, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
          notes: "Cable attachment, focus on squeeze",
        },
      ],
    },
    {
      id: "routine-mock-2",
      name: "Pull Day (Back/Biceps)",
      emoji: "🏋️",
      exercises: [
        {
          name: "Barbell Row",
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "Underhand or overhand grip",
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
        {
          name: "Hammer Curl",
          sets: [
            { weight: 35, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 35, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
    {
      id: "routine-mock-3",
      name: "Leg Day",
      emoji: "🦵",
      exercises: [
        {
          name: "Barbell Squat",
          sets: [
            { weight: 135, repsMin: 10, repsMax: 12, rpe: 6, type: "Warmup" },
            { weight: 225, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 225, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 225, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "Full depth, controlled tempo",
        },
        {
          name: "Romanian Deadlift",
          sets: [
            { weight: 185, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 185, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
          notes: "Focus on hamstring stretch",
        },
        {
          name: "Leg Press",
          sets: [
            { weight: 360, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 360, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Leg Curl",
          sets: [
            { weight: 90, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 90, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
  ];
  localStorage.setItem("workout-routines-v1", JSON.stringify(routines));

  // 6. Create meal templates for quick logging
  const savedMealTemplates = [
    {
      id: "meal-template-1",
      name: "High Protein Breakfast",
      items: mealTemplates[0].items,
      createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "meal-template-2",
      name: "Chicken & Rice Bowl",
      items: mealTemplates[1].items,
      createdAt: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "meal-template-3",
      name: "Post-Workout Shake",
      items: mealTemplates[4].items,
      createdAt: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  localStorage.setItem("meal-templates-v1", JSON.stringify(savedMealTemplates));

  // 7. Initialize empty media index
  localStorage.setItem("progress-media-index-v1", JSON.stringify({}));

  // Count generated data
  const weightDays = Object.keys(weightData).length;
  const dietDays = Object.keys(dietData).length;
  const workoutDays = Object.keys(workoutData).length;

  console.log('✅ Mock data loaded successfully!');
  console.log(`📅 Total period: 1.5 years (${totalDays} days)`);
  console.log(`👤 Profile: Demo User (started ${mockProfile.createdAt.split('T')[0]})`);
  console.log(`⚖️  Weight logs: ${weightDays} days (~${Math.round(weightDays/totalDays*100)}% logged)`);
  console.log(`   Starting: 205 lbs → Current: ~175 lbs (-30 lbs)`);
  console.log(`🍽️  Diet logs: ${dietDays} days (~${Math.round(dietDays/totalDays*100)}% logged)`);
  console.log(`   Average: 4 meals/day with USDA units`);
  console.log(`💪 Workout logs: ${workoutDays} sessions (~${Math.round(workoutDays/(totalDays/7))} per week)`);
  console.log(`   Progressive overload: +2.5 lbs every 3 weeks`);
  console.log(`📋 Routines: ${routines.length} workout templates (Push/Pull/Legs)`);
  console.log(`🍳 Meal Templates: ${savedMealTemplates.length} saved meals`);

  return true;
}

export function clearMockData() {
  const keysToRemove = [
    "profile-v1",
    "progress-weight-by-day-v1",
    "progress-media-index-v1",
    "diet-by-day-v2",
    "workout-by-day-v2",
    "workout-routines-v1",
    "meal-templates-v1",
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('🗑️  Mock data cleared!');
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
