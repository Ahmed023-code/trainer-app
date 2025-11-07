/**
 * Mock Data Generator for Testing - 2 Years
 *
 * Generates 2 years (730 days) of comprehensive sample data for:
 * - Weight logs with realistic fluctuations and plateaus
 * - Diet logs with varied meals and proper USDA food units
 * - Workout logs with progressive overload and deload weeks
 * - Workout routines with diverse exercise selection
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

// Helper to pick random item from array
const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export function loadMockData() {
  console.log('Loading comprehensive mock data for 2 years...');

  // 1. Create mock profile
  const mockProfile = {
    displayName: "Alex Training",
    createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
    isMockData: true,
  };
  localStorage.setItem("profile-v1", JSON.stringify(mockProfile));

  // 2. Create mock weight logs (2 years = 730 days with realistic patterns)
  const weightData: Record<string, number> = {};
  let baseWeight = 210; // Starting weight 2 years ago
  const targetWeight = 180; // Current weight after 2 years
  const totalDays = 730;

  // Simulate weight loss phases with plateaus
  const phases = [
    { days: 180, lossPerDay: 0.10 }, // Initial phase: rapid loss
    { days: 90, lossPerDay: 0.02 },  // Plateau 1
    { days: 180, lossPerDay: 0.08 }, // Phase 2: steady loss
    { days: 60, lossPerDay: 0.01 },  // Plateau 2
    { days: 150, lossPerDay: 0.05 }, // Phase 3: moderate loss
    { days: 70, lossPerDay: 0.01 },  // Maintenance/slight plateau
  ];

  let currentDay = totalDays - 1;
  for (const phase of phases) {
    for (let j = 0; j < phase.days && currentDay >= 0; j++, currentDay--) {
      const dateISO = getDateISO(currentDay);

      // Skip some days randomly (88% logged, 12% missed)
      if (Math.random() < 0.12) continue;

      // Apply weight change for this phase
      baseWeight -= phase.lossPerDay;

      // Add realistic daily fluctuations
      const dailyVariation = randomFloat(-2.0, 2.0);
      const weeklyPattern = Math.sin((currentDay % 7) / 7 * Math.PI * 2) * 1.0;
      const monthlyPattern = Math.sin((currentDay % 30) / 30 * Math.PI * 2) * 0.7;

      weightData[dateISO] = Math.round((baseWeight + dailyVariation + weeklyPattern + monthlyPattern) * 10) / 10;
    }
  }
  localStorage.setItem("progress-weight-by-day-v1", JSON.stringify(weightData));

  // 3. Create comprehensive diet logs with varied meals
  const dietData: Record<string, any> = {};

  // Breakfast options with proper USDA units and FDC IDs
  const breakfastOptions = [
    {
      name: "Oatmeal Power Bowl",
      items: [
        { name: "Oatmeal, Rolled Oats, Dry", fdcId: 173904, quantity: 1, unit: "50g", gramsPerUnit: 50, calories: 190, protein: 7, carbs: 32, fat: 4 },
        { name: "Banana, Medium", fdcId: 173944, quantity: 1, unit: "fruit (118g)", gramsPerUnit: 118, calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: "Whey Protein Isolate", fdcId: 174802, quantity: 1, unit: "30g scoop", gramsPerUnit: 30, calories: 120, protein: 24, carbs: 3, fat: 2 },
        { name: "Almond Butter", fdcId: 170567, quantity: 1, unit: "tbsp (16g)", gramsPerUnit: 16, calories: 98, protein: 3, carbs: 3, fat: 9 },
        { name: "Blueberries, Fresh", fdcId: 171711, quantity: 1, unit: "75g", gramsPerUnit: 75, calories: 43, protein: 1, carbs: 11, fat: 0 },
      ],
    },
    {
      name: "Egg White Scramble",
      items: [
        { name: "Egg Whites, Liquid", fdcId: 171287, quantity: 1, unit: "120ml (½ cup)", gramsPerUnit: 120, calories: 63, protein: 13, carbs: 1, fat: 0 },
        { name: "Whole Eggs", fdcId: 171287, quantity: 2, unit: "large egg", gramsPerUnit: 50, calories: 72, protein: 6, carbs: 1, fat: 5 },
        { name: "Spinach, Fresh", fdcId: 168462, quantity: 1, unit: "30g cup", gramsPerUnit: 30, calories: 7, protein: 1, carbs: 1, fat: 0 },
        { name: "Whole Wheat Toast", fdcId: 172687, quantity: 2, unit: "slice (32g)", gramsPerUnit: 32, calories: 80, protein: 4, carbs: 13, fat: 1 },
        { name: "Avocado", fdcId: 171705, quantity: 1, unit: "50g (¼ fruit)", gramsPerUnit: 50, calories: 80, protein: 1, carbs: 4, fat: 7 },
      ],
    },
    {
      name: "Greek Yogurt Parfait",
      items: [
        { name: "Greek Yogurt, Nonfat Plain", fdcId: 170903, quantity: 1, unit: "227g cup", gramsPerUnit: 227, calories: 130, protein: 23, carbs: 9, fat: 0 },
        { name: "Granola, Low Sugar", fdcId: 173803, quantity: 1, unit: "40g serving", gramsPerUnit: 40, calories: 140, protein: 4, carbs: 25, fat: 3 },
        { name: "Strawberries, Fresh", fdcId: 167762, quantity: 1, unit: "150g cup", gramsPerUnit: 150, calories: 48, protein: 1, carbs: 12, fat: 0 },
        { name: "Honey", fdcId: 169640, quantity: 1, unit: "tsp (7g)", gramsPerUnit: 7, calories: 21, protein: 0, carbs: 6, fat: 0 },
        { name: "Almonds, Sliced", fdcId: 170567, quantity: 1, unit: "14g (2 tbsp)", gramsPerUnit: 14, calories: 80, protein: 3, carbs: 3, fat: 7 },
      ],
    },
    {
      name: "Protein Pancakes",
      items: [
        { name: "Protein Pancake Mix", fdcId: 173905, quantity: 1, unit: "50g serving", gramsPerUnit: 50, calories: 180, protein: 15, carbs: 24, fat: 3 },
        { name: "Banana, Medium", fdcId: 173944, quantity: 1, unit: "fruit (118g)", gramsPerUnit: 118, calories: 105, protein: 1, carbs: 27, fat: 0 },
        { name: "Maple Syrup, Sugar Free", fdcId: 169640, quantity: 1, unit: "30ml (2 tbsp)", gramsPerUnit: 30, calories: 30, protein: 0, carbs: 8, fat: 0 },
        { name: "Turkey Bacon", fdcId: 172653, quantity: 2, unit: "strips (28g)", gramsPerUnit: 14, calories: 60, protein: 6, carbs: 1, fat: 4 },
      ],
    },
  ];

  // Lunch options with FDC IDs
  const lunchOptions = [
    {
      name: "Chicken & Rice Bowl",
      items: [
        { name: "Chicken Breast, Grilled", fdcId: 171477, quantity: 1, unit: "180g", gramsPerUnit: 180, calories: 297, protein: 56, carbs: 0, fat: 6 },
        { name: "Brown Rice, Cooked", fdcId: 168878, quantity: 1, unit: "195g cup", gramsPerUnit: 195, calories: 218, protein: 5, carbs: 46, fat: 2 },
        { name: "Broccoli, Steamed", fdcId: 170379, quantity: 1, unit: "156g cup", gramsPerUnit: 156, calories: 55, protein: 4, carbs: 11, fat: 1 },
        { name: "Olive Oil", fdcId: 171413, quantity: 1, unit: "tbsp (13.5g)", gramsPerUnit: 13.5, calories: 119, protein: 0, carbs: 0, fat: 14 },
        { name: "Soy Sauce, Low Sodium", fdcId: 16424, quantity: 1, unit: "tbsp (15ml)", gramsPerUnit: 15, calories: 10, protein: 1, carbs: 1, fat: 0 },
      ],
    },
    {
      name: "Turkey Sandwich",
      items: [
        { name: "Turkey Breast, Deli", fdcId: 172653, quantity: 1, unit: "112g (4 oz)", gramsPerUnit: 112, calories: 120, protein: 24, carbs: 4, fat: 2 },
        { name: "Whole Wheat Bread", fdcId: 172687, quantity: 2, unit: "slice (32g)", gramsPerUnit: 32, calories: 80, protein: 4, carbs: 13, fat: 1 },
        { name: "Lettuce, Romaine", fdcId: 169248, quantity: 1, unit: "30g", gramsPerUnit: 30, calories: 5, protein: 0, carbs: 1, fat: 0 },
        { name: "Tomato, Medium", fdcId: 170457, quantity: 3, unit: "slices (60g)", gramsPerUnit: 20, calories: 11, protein: 1, carbs: 2, fat: 0 },
        { name: "Mustard, Yellow", fdcId: 173734, quantity: 1, unit: "tsp (5g)", gramsPerUnit: 5, calories: 3, protein: 0, carbs: 0, fat: 0 },
        { name: "Apple, Medium", fdcId: 171688, quantity: 1, unit: "fruit (182g)", gramsPerUnit: 182, calories: 95, protein: 0, carbs: 25, fat: 0 },
      ],
    },
    {
      name: "Tuna Salad Bowl",
      items: [
        { name: "Tuna, Canned in Water", fdcId: 175149, quantity: 1, unit: "142g can", gramsPerUnit: 142, calories: 191, protein: 42, carbs: 0, fat: 1 },
        { name: "Mixed Greens", fdcId: 169248, quantity: 1, unit: "85g (3 cups)", gramsPerUnit: 85, calories: 20, protein: 2, carbs: 4, fat: 0 },
        { name: "Cherry Tomatoes", fdcId: 170457, quantity: 1, unit: "149g cup", gramsPerUnit: 149, calories: 27, protein: 1, carbs: 6, fat: 0 },
        { name: "Cucumber, Sliced", fdcId: 168409, quantity: 1, unit: "100g", gramsPerUnit: 100, calories: 15, protein: 1, carbs: 4, fat: 0 },
        { name: "Balsamic Vinaigrette", fdcId: 171006, quantity: 2, unit: "tbsp (30ml)", gramsPerUnit: 15, calories: 45, protein: 0, carbs: 2, fat: 4 },
        { name: "Whole Wheat Crackers", fdcId: 172689, quantity: 1, unit: "30g (12 crackers)", gramsPerUnit: 30, calories: 130, protein: 3, carbs: 22, fat: 3 },
      ],
    },
    {
      name: "Beef Burrito Bowl",
      items: [
        { name: "Ground Beef, 90% Lean", fdcId: 174033, quantity: 1, unit: "113g (4 oz)", gramsPerUnit: 113, calories: 200, protein: 23, carbs: 0, fat: 11 },
        { name: "Brown Rice, Cooked", fdcId: 168878, quantity: 1, unit: "195g cup", gramsPerUnit: 195, calories: 218, protein: 5, carbs: 46, fat: 2 },
        { name: "Black Beans, Canned", fdcId: 175196, quantity: 1, unit: "86g (½ cup)", gramsPerUnit: 86, calories: 114, protein: 8, carbs: 20, fat: 0 },
        { name: "Salsa, Red", fdcId: 173735, quantity: 1, unit: "60g (¼ cup)", gramsPerUnit: 60, calories: 18, protein: 1, carbs: 4, fat: 0 },
        { name: "Lettuce, Shredded", fdcId: 169248, quantity: 1, unit: "30g", gramsPerUnit: 30, calories: 5, protein: 0, carbs: 1, fat: 0 },
        { name: "Greek Yogurt, Plain", fdcId: 170903, quantity: 1, unit: "60g (sour cream sub)", gramsPerUnit: 60, calories: 35, protein: 6, carbs: 2, fat: 0 },
      ],
    },
  ];

  // Dinner options with FDC IDs
  const dinnerOptions = [
    {
      name: "Grilled Salmon Dinner",
      items: [
        { name: "Salmon, Atlantic, Cooked", fdcId: 175167, quantity: 1, unit: "170g fillet", gramsPerUnit: 170, calories: 350, protein: 45, carbs: 0, fat: 18 },
        { name: "Sweet Potato, Baked", fdcId: 168482, quantity: 1, unit: "medium (150g)", gramsPerUnit: 150, calories: 130, protein: 2, carbs: 30, fat: 0 },
        { name: "Asparagus, Grilled", fdcId: 169228, quantity: 1, unit: "134g (6 spears)", gramsPerUnit: 134, calories: 27, protein: 3, carbs: 5, fat: 0 },
        { name: "Butter", fdcId: 173410, quantity: 1, unit: "tsp (5g)", gramsPerUnit: 5, calories: 34, protein: 0, carbs: 0, fat: 4 },
        { name: "Lemon Juice", fdcId: 167746, quantity: 1, unit: "15ml (1 tbsp)", gramsPerUnit: 15, calories: 4, protein: 0, carbs: 1, fat: 0 },
      ],
    },
    {
      name: "Steak & Potatoes",
      items: [
        { name: "Sirloin Steak, Grilled", fdcId: 174032, quantity: 1, unit: "180g (6 oz)", gramsPerUnit: 180, calories: 360, protein: 49, carbs: 0, fat: 17 },
        { name: "Baked Potato with Skin", fdcId: 170093, quantity: 1, unit: "medium (173g)", gramsPerUnit: 173, calories: 161, protein: 4, carbs: 37, fat: 0 },
        { name: "Green Beans, Steamed", fdcId: 169961, quantity: 1, unit: "125g cup", gramsPerUnit: 125, calories: 44, protein: 2, carbs: 10, fat: 0 },
        { name: "Sour Cream, Light", fdcId: 170881, quantity: 1, unit: "30g (2 tbsp)", gramsPerUnit: 30, calories: 40, protein: 1, carbs: 2, fat: 3 },
        { name: "Chives, Fresh", fdcId: 169962, quantity: 1, unit: "3g (1 tbsp)", gramsPerUnit: 3, calories: 1, protein: 0, carbs: 0, fat: 0 },
      ],
    },
    {
      name: "Chicken Pasta",
      items: [
        { name: "Chicken Breast, Grilled", fdcId: 171477, quantity: 1, unit: "140g", gramsPerUnit: 140, calories: 231, protein: 44, carbs: 0, fat: 5 },
        { name: "Whole Wheat Pasta, Cooked", fdcId: 169738, quantity: 1, unit: "140g cup", gramsPerUnit: 140, calories: 174, protein: 7, carbs: 37, fat: 1 },
        { name: "Marinara Sauce", fdcId: 171192, quantity: 1, unit: "125g (½ cup)", gramsPerUnit: 125, calories: 70, protein: 2, carbs: 12, fat: 2 },
        { name: "Parmesan Cheese, Grated", fdcId: 170899, quantity: 1, unit: "10g (2 tbsp)", gramsPerUnit: 10, calories: 43, protein: 4, carbs: 0, fat: 3 },
        { name: "Mixed Vegetables, Steamed", fdcId: 170108, quantity: 1, unit: "91g (½ cup)", gramsPerUnit: 91, calories: 59, protein: 3, carbs: 12, fat: 0 },
      ],
    },
    {
      name: "Cod & Quinoa",
      items: [
        { name: "Cod Fillet, Baked", fdcId: 175168, quantity: 1, unit: "150g", gramsPerUnit: 150, calories: 150, protein: 32, carbs: 0, fat: 1 },
        { name: "Quinoa, Cooked", fdcId: 168917, quantity: 1, unit: "185g cup", gramsPerUnit: 185, calories: 222, protein: 8, carbs: 39, fat: 4 },
        { name: "Brussels Sprouts, Roasted", fdcId: 169975, quantity: 1, unit: "156g cup", gramsPerUnit: 156, calories: 56, protein: 4, carbs: 11, fat: 1 },
        { name: "Olive Oil", fdcId: 171413, quantity: 1, unit: "tbsp (13.5g)", gramsPerUnit: 13.5, calories: 119, protein: 0, carbs: 0, fat: 14 },
      ],
    },
    {
      name: "Turkey Meatballs",
      items: [
        { name: "Ground Turkey, 93% Lean", fdcId: 171116, quantity: 1, unit: "140g (5 oz)", gramsPerUnit: 140, calories: 213, protein: 28, carbs: 0, fat: 10 },
        { name: "Zucchini Noodles", fdcId: 169291, quantity: 1, unit: "200g", gramsPerUnit: 200, calories: 34, protein: 2, carbs: 6, fat: 1 },
        { name: "Marinara Sauce", fdcId: 171192, quantity: 1, unit: "125g (½ cup)", gramsPerUnit: 125, calories: 70, protein: 2, carbs: 12, fat: 2 },
        { name: "Mozzarella, Part Skim", fdcId: 173420, quantity: 1, unit: "28g (1 oz)", gramsPerUnit: 28, calories: 72, protein: 7, carbs: 1, fat: 5 },
        { name: "Garlic Bread", fdcId: 172687, quantity: 1, unit: "slice (40g)", gramsPerUnit: 40, calories: 120, protein: 3, carbs: 16, fat: 4 },
      ],
    },
  ];

  // Snack options with FDC IDs
  const snackOptions = [
    {
      name: "Protein Snack",
      items: [
        { name: "Greek Yogurt, Nonfat Plain", fdcId: 170903, quantity: 1, unit: "170g container", gramsPerUnit: 170, calories: 100, protein: 17, carbs: 7, fat: 0 },
        { name: "Almonds, Raw", fdcId: 170567, quantity: 1, unit: "28g (23 almonds)", gramsPerUnit: 28, calories: 164, protein: 6, carbs: 6, fat: 14 },
      ],
    },
    {
      name: "Fruit & Nuts",
      items: [
        { name: "Apple, Medium", fdcId: 171688, quantity: 1, unit: "fruit (182g)", gramsPerUnit: 182, calories: 95, protein: 0, carbs: 25, fat: 0 },
        { name: "Peanut Butter, Natural", fdcId: 172470, quantity: 1, unit: "tbsp (16g)", gramsPerUnit: 16, calories: 96, protein: 4, carbs: 3, fat: 8 },
      ],
    },
    {
      name: "Protein Bar",
      items: [
        { name: "Protein Bar", fdcId: 174802, quantity: 1, unit: "bar (60g)", gramsPerUnit: 60, calories: 200, protein: 20, carbs: 24, fat: 6 },
      ],
    },
    {
      name: "Cottage Cheese Bowl",
      items: [
        { name: "Cottage Cheese, Low Fat", fdcId: 173417, quantity: 1, unit: "113g (½ cup)", gramsPerUnit: 113, calories: 81, protein: 14, carbs: 3, fat: 1 },
        { name: "Pineapple, Fresh", fdcId: 169124, quantity: 1, unit: "80g (½ cup)", gramsPerUnit: 80, calories: 41, protein: 0, carbs: 11, fat: 0 },
      ],
    },
    {
      name: "Protein Shake",
      items: [
        { name: "Whey Protein Isolate", fdcId: 174802, quantity: 1, unit: "30g scoop", gramsPerUnit: 30, calories: 120, protein: 24, carbs: 3, fat: 2 },
        { name: "Almond Milk, Unsweetened", fdcId: 174832, quantity: 1, unit: "240ml cup", gramsPerUnit: 240, calories: 30, protein: 1, carbs: 1, fat: 2.5 },
        { name: "Banana, Medium", fdcId: 173944, quantity: 1, unit: "fruit (118g)", gramsPerUnit: 118, calories: 105, protein: 1, carbs: 27, fat: 0 },
      ],
    },
  ];

  // Generate diet logs
  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);

    // Skip some days randomly (78% logged, 22% missed)
    if (Math.random() < 0.22) continue;

    const numMeals = random(3, 5);
    const meals = [];

    // Breakfast (always included)
    meals.push(pickRandom(breakfastOptions));

    // Lunch
    if (numMeals >= 2) {
      meals.push(pickRandom(lunchOptions));
    }

    // Snack
    if (numMeals >= 3) {
      meals.push(pickRandom(snackOptions));
    }

    // Dinner
    if (numMeals >= 4) {
      meals.push(pickRandom(dinnerOptions));
    }

    // Evening snack
    if (numMeals >= 5) {
      meals.push(pickRandom(snackOptions));
    }

    // Calorie targets vary based on phase
    const currentPhase = Math.floor(i / 180);
    let calorieTarget = 2500;
    if (currentPhase <= 1) calorieTarget = 2200; // Initial deficit
    else if (currentPhase <= 3) calorieTarget = 2400; // Moderate deficit
    else calorieTarget = 2600; // Maintenance

    dietData[dateISO] = {
      meals: meals,
      goals: {
        cal: calorieTarget,
        p: 180,
        c: Math.floor(calorieTarget * 0.40 / 4),
        f: Math.floor(calorieTarget * 0.25 / 9),
      },
    };
  }
  localStorage.setItem("diet-by-day-v2", JSON.stringify(dietData));

  // 4. Create comprehensive workout logs with progressive overload
  const workoutData: Record<string, any> = {};

  // Enhanced exercise templates with progressive overload and deload weeks
  const createPushExercises = (weekNumber: number) => {
    // Every 4th week is a deload week (reduce weight by 15%)
    const isDeload = weekNumber % 4 === 3;
    const progressMultiplier = isDeload ? 0 : Math.floor(weekNumber / 4) * 5;

    return [
      {
        name: "Barbell Bench Press",
        sets: [
          { weight: 135, repsMin: 10, repsMax: 12, rpe: 5, type: "Warmup", repsPerformed: random(10, 12) },
          { weight: 165, repsMin: 6, repsMax: 8, rpe: 6, type: "Warmup", repsPerformed: random(6, 8) },
          { weight: 195 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 195 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 195 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 9, type: "Working", repsPerformed: random(5, 7) },
        ],
        source: "quick-add" as const,
        notes: isDeload ? "Deload week - lighter weight" : (weekNumber % 4 === 0 ? "New weight PR!" : ""),
      },
      {
        name: "Incline Dumbbell Press",
        sets: [
          { weight: 65 + progressMultiplier * 0.6, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 65 + progressMultiplier * 0.6, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 65 + progressMultiplier * 0.6, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Overhead Press (Barbell)",
        sets: [
          { weight: 105 + progressMultiplier * 0.6, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 105 + progressMultiplier * 0.6, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 105 + progressMultiplier * 0.6, repsMin: 6, repsMax: 8, rpe: 9, type: "Working", repsPerformed: random(5, 7) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Lateral Raise (Dumbbell)",
        sets: [
          { weight: 20 + progressMultiplier * 0.3, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 20 + progressMultiplier * 0.3, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 20 + progressMultiplier * 0.3, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Tricep Dips (Weighted)",
        sets: [
          { weight: 25 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 25 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 25 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Cable Tricep Pushdown",
        sets: [
          { weight: 80 + progressMultiplier * 0.6, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 80 + progressMultiplier * 0.6, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
    ];
  };

  const createPullExercises = (weekNumber: number) => {
    const isDeload = weekNumber % 4 === 3;
    const progressMultiplier = isDeload ? 0 : Math.floor(weekNumber / 4) * 5;

    return [
      {
        name: "Deadlift (Conventional)",
        sets: [
          { weight: 135, repsMin: 8, repsMax: 10, rpe: 5, type: "Warmup", repsPerformed: random(8, 10) },
          { weight: 225, repsMin: 5, repsMax: 6, rpe: 6, type: "Warmup", repsPerformed: random(5, 6) },
          { weight: 315 + progressMultiplier, repsMin: 3, repsMax: 5, rpe: 8, type: "Working", repsPerformed: random(3, 5) },
          { weight: 315 + progressMultiplier, repsMin: 3, repsMax: 5, rpe: 9, type: "Working", repsPerformed: random(3, 5) },
          { weight: 315 + progressMultiplier, repsMin: 3, repsMax: 5, rpe: 9, type: "Working", repsPerformed: random(2, 4) },
        ],
        source: "quick-add" as const,
        notes: isDeload ? "Deload week" : (weekNumber % 4 === 0 ? "New PR!" : "Felt strong"),
      },
      {
        name: "Barbell Row (Bent Over)",
        sets: [
          { weight: 155 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 155 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 155 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 9, type: "Working", repsPerformed: random(5, 7) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Pull-Ups (Weighted)",
        sets: [
          { weight: 0, repsMin: 8, repsMax: 10, rpe: 6, type: "Warmup", repsPerformed: random(8, 10) },
          { weight: 25 + progressMultiplier * 0.4, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 25 + progressMultiplier * 0.4, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 25 + progressMultiplier * 0.4, repsMin: 6, repsMax: 8, rpe: 9, type: "Working", repsPerformed: random(5, 7) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Lat Pulldown (Wide Grip)",
        sets: [
          { weight: 140 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 140 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 140 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Seated Cable Row",
        sets: [
          { weight: 130 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 130 + progressMultiplier, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Dumbbell Hammer Curl",
        sets: [
          { weight: 40 + progressMultiplier * 0.4, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 40 + progressMultiplier * 0.4, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Face Pulls (Cable)",
        sets: [
          { weight: 70 + progressMultiplier * 0.5, repsMin: 15, repsMax: 20, rpe: 8, type: "Working", repsPerformed: random(15, 20) },
          { weight: 70 + progressMultiplier * 0.5, repsMin: 15, repsMax: 20, rpe: 8, type: "Working", repsPerformed: random(15, 20) },
        ],
        source: "quick-add" as const,
      },
    ];
  };

  const createLegExercises = (weekNumber: number) => {
    const isDeload = weekNumber % 4 === 3;
    const progressMultiplier = isDeload ? 0 : Math.floor(weekNumber / 4) * 5;

    return [
      {
        name: "Barbell Back Squat",
        sets: [
          { weight: 135, repsMin: 8, repsMax: 10, rpe: 5, type: "Warmup", repsPerformed: random(8, 10) },
          { weight: 185, repsMin: 5, repsMax: 6, rpe: 6, type: "Warmup", repsPerformed: random(5, 6) },
          { weight: 275 + progressMultiplier, repsMin: 4, repsMax: 6, rpe: 8, type: "Working", repsPerformed: random(4, 6) },
          { weight: 275 + progressMultiplier, repsMin: 4, repsMax: 6, rpe: 8, type: "Working", repsPerformed: random(4, 6) },
          { weight: 275 + progressMultiplier, repsMin: 4, repsMax: 6, rpe: 9, type: "Working", repsPerformed: random(3, 5) },
        ],
        source: "quick-add" as const,
        notes: isDeload ? "Deload week" : (weekNumber % 5 === 0 ? "New squat PR!" : ""),
      },
      {
        name: "Romanian Deadlift",
        sets: [
          { weight: 205 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 205 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 205 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Leg Press (Machine)",
        sets: [
          { weight: 400 + progressMultiplier * 5, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 400 + progressMultiplier * 5, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 400 + progressMultiplier * 5, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Walking Lunges (Dumbbell)",
        sets: [
          { weight: 45 + progressMultiplier * 0.5, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 45 + progressMultiplier * 0.5, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 45 + progressMultiplier * 0.5, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Leg Curl (Lying)",
        sets: [
          { weight: 100 + progressMultiplier * 0.7, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 100 + progressMultiplier * 0.7, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Calf Raise (Standing)",
        sets: [
          { weight: 180 + progressMultiplier, repsMin: 15, repsMax: 20, rpe: 8, type: "Working", repsPerformed: random(15, 20) },
          { weight: 180 + progressMultiplier, repsMin: 15, repsMax: 20, rpe: 8, type: "Working", repsPerformed: random(15, 20) },
          { weight: 180 + progressMultiplier, repsMin: 15, repsMax: 20, rpe: 9, type: "Working", repsPerformed: random(14, 19) },
        ],
        source: "quick-add" as const,
      },
    ];
  };

  const createUpperExercises = (weekNumber: number) => {
    const isDeload = weekNumber % 4 === 3;
    const progressMultiplier = isDeload ? 0 : Math.floor(weekNumber / 4) * 5;

    return [
      {
        name: "Incline Barbell Bench Press",
        sets: [
          { weight: 135, repsMin: 8, repsMax: 10, rpe: 6, type: "Warmup", repsPerformed: random(8, 10) },
          { weight: 175 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 8, type: "Working", repsPerformed: random(6, 8) },
          { weight: 175 + progressMultiplier, repsMin: 6, repsMax: 8, rpe: 9, type: "Working", repsPerformed: random(5, 7) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Chest Supported Row (Machine)",
        sets: [
          { weight: 130 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 130 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 130 + progressMultiplier, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Dumbbell Shoulder Press",
        sets: [
          { weight: 55 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 8, type: "Working", repsPerformed: random(8, 10) },
          { weight: 55 + progressMultiplier * 0.5, repsMin: 8, repsMax: 10, rpe: 9, type: "Working", repsPerformed: random(7, 9) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Cable Fly (High to Low)",
        sets: [
          { weight: 35 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 35 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Barbell Curl",
        sets: [
          { weight: 75 + progressMultiplier * 0.5, repsMin: 10, repsMax: 12, rpe: 8, type: "Working", repsPerformed: random(10, 12) },
          { weight: 75 + progressMultiplier * 0.5, repsMin: 10, repsMax: 12, rpe: 9, type: "Working", repsPerformed: random(9, 11) },
        ],
        source: "quick-add" as const,
      },
      {
        name: "Overhead Tricep Extension (Cable)",
        sets: [
          { weight: 60 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 8, type: "Working", repsPerformed: random(12, 15) },
          { weight: 60 + progressMultiplier * 0.5, repsMin: 12, repsMax: 15, rpe: 9, type: "Working", repsPerformed: random(11, 14) },
        ],
        source: "quick-add" as const,
      },
    ];
  };

  const workoutNotes = [
    "Felt strong today! Great session.",
    "Good pump, hit all targets",
    "Tired but pushed through",
    "Excellent workout, new PR!",
    "Form felt perfect today",
    "Solid session, great mind-muscle connection",
    "Felt a bit sluggish but finished",
    "Best workout this week",
    "Increased weight on main lifts",
    "Focus on tempo today, great results",
    "Energy was high, crushed it",
    "Recovery felt good, no issues",
  ];

  // Generate workouts: Push/Pull/Legs/Upper split, 4-5 days per week
  let daysSinceLastWorkout = 0;
  let workoutRotation = 0; // 0 = Push, 1 = Pull, 2 = Legs, 3 = Upper

  for (let i = totalDays - 1; i >= 0; i--) {
    const dateISO = getDateISO(i);
    const weekNumber = Math.floor((totalDays - i) / 7);

    daysSinceLastWorkout++;

    // Workout frequency: rest day if worked out yesterday, or random rest (35% chance)
    const shouldRest = daysSinceLastWorkout < 2 || Math.random() < 0.35;

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
    } else if (workoutRotation === 2) {
      exercises = createLegExercises(weekNumber);
      workoutType = "Leg Day";
    } else {
      exercises = createUpperExercises(weekNumber);
      workoutType = "Upper Body Day";
    }

    workoutData[dateISO] = {
      exercises: exercises,
      notes: `${workoutType} - ${pickRandom(workoutNotes)}`,
    };

    // Advance rotation
    workoutRotation = (workoutRotation + 1) % 4;
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
            { weight: 135, repsMin: 10, repsMax: 12, rpe: 5, type: "Warmup" },
            { weight: 165, repsMin: 6, repsMax: 8, rpe: 6, type: "Warmup" },
            { weight: 195, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 195, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 195, repsMin: 6, repsMax: 8, rpe: 9, type: "Working" },
          ],
          notes: "Focus on controlled descent, explosive press",
        },
        {
          name: "Incline Dumbbell Press",
          sets: [
            { weight: 65, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 65, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 65, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "30-40 degree incline, full ROM",
        },
        {
          name: "Overhead Press (Barbell)",
          sets: [
            { weight: 105, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 105, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 105, repsMin: 6, repsMax: 8, rpe: 9, type: "Working" },
          ],
          notes: "Strict form, no leg drive",
        },
        {
          name: "Lateral Raise (Dumbbell)",
          sets: [
            { weight: 20, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 20, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 20, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Tricep Dips (Weighted)",
          sets: [
            { weight: 25, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 25, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 25, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Cable Tricep Pushdown",
          sets: [
            { weight: 80, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 80, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
    {
      id: "routine-mock-2",
      name: "Pull Day (Back/Biceps)",
      emoji: "🏋️",
      exercises: [
        {
          name: "Deadlift (Conventional)",
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 5, type: "Warmup" },
            { weight: 225, repsMin: 5, repsMax: 6, rpe: 6, type: "Warmup" },
            { weight: 315, repsMin: 3, repsMax: 5, rpe: 8, type: "Working" },
            { weight: 315, repsMin: 3, repsMax: 5, rpe: 9, type: "Working" },
            { weight: 315, repsMin: 3, repsMax: 5, rpe: 9, type: "Working" },
          ],
          notes: "Keep back neutral, drive through heels",
        },
        {
          name: "Barbell Row (Bent Over)",
          sets: [
            { weight: 155, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 155, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 155, repsMin: 6, repsMax: 8, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Pull-Ups (Weighted)",
          sets: [
            { weight: 0, repsMin: 8, repsMax: 10, rpe: 6, type: "Warmup" },
            { weight: 25, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 25, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 25, repsMin: 6, repsMax: 8, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Lat Pulldown (Wide Grip)",
          sets: [
            { weight: 140, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 140, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 140, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Seated Cable Row",
          sets: [
            { weight: 130, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 130, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Dumbbell Hammer Curl",
          sets: [
            { weight: 40, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 40, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Face Pulls (Cable)",
          sets: [
            { weight: 70, repsMin: 15, repsMax: 20, rpe: 8, type: "Working" },
            { weight: 70, repsMin: 15, repsMax: 20, rpe: 8, type: "Working" },
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
          name: "Barbell Back Squat",
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 5, type: "Warmup" },
            { weight: 185, repsMin: 5, repsMax: 6, rpe: 6, type: "Warmup" },
            { weight: 275, repsMin: 4, repsMax: 6, rpe: 8, type: "Working" },
            { weight: 275, repsMin: 4, repsMax: 6, rpe: 8, type: "Working" },
            { weight: 275, repsMin: 4, repsMax: 6, rpe: 9, type: "Working" },
          ],
          notes: "Full depth, controlled tempo",
        },
        {
          name: "Romanian Deadlift",
          sets: [
            { weight: 205, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 205, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 205, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
          notes: "Focus on hamstring stretch",
        },
        {
          name: "Leg Press (Machine)",
          sets: [
            { weight: 400, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 400, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 400, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Walking Lunges (Dumbbell)",
          sets: [
            { weight: 45, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 45, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 45, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Leg Curl (Lying)",
          sets: [
            { weight: 100, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 100, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Calf Raise (Standing)",
          sets: [
            { weight: 180, repsMin: 15, repsMax: 20, rpe: 8, type: "Working" },
            { weight: 180, repsMin: 15, repsMax: 20, rpe: 8, type: "Working" },
            { weight: 180, repsMin: 15, repsMax: 20, rpe: 9, type: "Working" },
          ],
        },
      ],
    },
    {
      id: "routine-mock-4",
      name: "Upper Body Day",
      emoji: "💯",
      exercises: [
        {
          name: "Incline Barbell Bench Press",
          sets: [
            { weight: 135, repsMin: 8, repsMax: 10, rpe: 6, type: "Warmup" },
            { weight: 175, repsMin: 6, repsMax: 8, rpe: 8, type: "Working" },
            { weight: 175, repsMin: 6, repsMax: 8, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Chest Supported Row (Machine)",
          sets: [
            { weight: 130, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 130, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 130, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Dumbbell Shoulder Press",
          sets: [
            { weight: 55, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" },
            { weight: 55, repsMin: 8, repsMax: 10, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Cable Fly (High to Low)",
          sets: [
            { weight: 35, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 35, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Barbell Curl",
          sets: [
            { weight: 75, repsMin: 10, repsMax: 12, rpe: 8, type: "Working" },
            { weight: 75, repsMin: 10, repsMax: 12, rpe: 9, type: "Working" },
          ],
        },
        {
          name: "Overhead Tricep Extension (Cable)",
          sets: [
            { weight: 60, repsMin: 12, repsMax: 15, rpe: 8, type: "Working" },
            { weight: 60, repsMin: 12, repsMax: 15, rpe: 9, type: "Working" },
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
      name: "Oatmeal Power Bowl",
      items: breakfastOptions[0].items,
      createdAt: new Date(Date.now() - 600 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "meal-template-2",
      name: "Chicken & Rice Bowl",
      items: lunchOptions[0].items,
      createdAt: new Date(Date.now() - 580 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "meal-template-3",
      name: "Grilled Salmon Dinner",
      items: dinnerOptions[0].items,
      createdAt: new Date(Date.now() - 560 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "meal-template-4",
      name: "Protein Shake",
      items: snackOptions[4].items,
      createdAt: new Date(Date.now() - 540 * 24 * 60 * 60 * 1000).toISOString(),
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
  console.log(`📅 Total period: 2 years (${totalDays} days)`);
  console.log(`👤 Profile: ${mockProfile.displayName} (started ${mockProfile.createdAt.split('T')[0]})`);
  console.log(`⚖️  Weight logs: ${weightDays} days (~${Math.round(weightDays/totalDays*100)}% logged)`);
  console.log(`   Starting: 210 lbs → Current: ~180 lbs (-30 lbs)`);
  console.log(`🍽️  Diet logs: ${dietDays} days (~${Math.round(dietDays/totalDays*100)}% logged)`);
  console.log(`   Varied meals with realistic calorie targets`);
  console.log(`💪 Workout logs: ${workoutDays} sessions (~${Math.round(workoutDays/(totalDays/7))} per week)`);
  console.log(`   Progressive overload with deload weeks every 4th week`);
  console.log(`📋 Routines: ${routines.length} workout templates (Push/Pull/Legs/Upper)`);
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
