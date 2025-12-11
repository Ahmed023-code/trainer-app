"use client";

const mockWeightTrend = [187.4, 187.1, 186.8, 186.2, 185.9, 185.7, 185.5];
const mockMeals = [
  { name: "Breakfast", calories: 520, protein: 36, carbs: 48, fat: 18 },
  { name: "Lunch", calories: 640, protein: 42, carbs: 68, fat: 20 },
  { name: "Dinner", calories: 710, protein: 48, carbs: 70, fat: 24 },
  { name: "Snacks", calories: 320, protein: 18, carbs: 30, fat: 10 },
];

const mockWorkout = {
  focus: "Upper Body",
  volume: "18 working sets",
  highlights: [
    "Bench Press · 4 x 10 @ 155 lb",
    "Pull Ups · 5 x AMRAP",
    "Dumbbell Row · 3 x 12 @ 65 lb",
  ],
};

export default function HomePage() {
  const totalCalories = mockMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = mockMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = mockMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = mockMeals.reduce((sum, meal) => sum + meal.fat, 0);

  return (
    <main className="space-y-6 pt-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Overview</p>
        <h1 className="text-3xl font-semibold">Today</h1>
        <p className="text-sm text-neutral-500">Mock dashboard for design exploration</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/70 p-4 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-neutral-500">Current Weight</p>
              <p className="text-3xl font-semibold">185.5 lb</p>
            </div>
            <span className="rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-3 py-1 text-xs font-medium">-1.9 lb</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-neutral-500">
            {mockWeightTrend.map((value, idx) => (
              <div key={value + idx} className="flex flex-col items-center gap-1">
                <div className="h-16 w-full rounded-full bg-gradient-to-t from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 overflow-hidden">
                  <div
                    className="w-full bg-blue-500/70 h-full"
                    style={{ height: `${((value - 184) / 4) * 100}%` }}
                  />
                </div>
                <span className="text-[10px]">Day {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/70 p-4 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-neutral-500">Nutrition</p>
              <p className="text-3xl font-semibold">{totalCalories} kcal</p>
            </div>
            <div className="text-xs text-right text-neutral-500">
              <p>Protein · {totalProtein}g</p>
              <p>Carbs · {totalCarbs}g</p>
              <p>Fat · {totalFat}g</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {mockMeals.map((meal) => (
              <div key={meal.name} className="flex items-center justify-between rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-neutral-500">
                    {meal.protein}g P · {meal.carbs}g C · {meal.fat}g F
                  </p>
                </div>
                <span className="text-sm font-semibold">{meal.calories} kcal</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/70 p-4 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Workout Focus</p>
              <h2 className="text-xl font-semibold">{mockWorkout.focus}</h2>
              <p className="text-sm text-neutral-500">{mockWorkout.volume}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 text-xs font-medium">
              Mock Plan
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {mockWorkout.highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/70 dark:bg-neutral-900/70 p-4 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Reminders</p>
              <h2 className="text-xl font-semibold">Lightweight Checklist</h2>
              <p className="text-sm text-neutral-500">Static items to visualize the UI</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-medium">
              UI Only
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {["Grocery run for meal prep", "Refill water bottle", "Evening mobility flow"].map((item, idx) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2"
              >
                <span className={`h-3 w-3 rounded-full ${idx === 0 ? "bg-green-500" : "bg-neutral-400"}`} />
                <div>
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-xs text-neutral-500">Mock reminder, no actions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
