"use client";

const mockMealPlan = [
  {
    name: "Breakfast Bowl",
    time: "08:00",
    calories: 520,
    macros: "36g P · 48g C · 18g F",
    items: ["3 eggs", "Spinach", "Sweet potato", "Avocado"],
  },
  {
    name: "Lunch Wrap",
    time: "12:30",
    calories: 640,
    macros: "42g P · 68g C · 20g F",
    items: ["Chicken breast", "Whole wheat wrap", "Roasted peppers", "Greek yogurt"],
  },
  {
    name: "Post Workout",
    time: "16:30",
    calories: 320,
    macros: "32g P · 40g C · 4g F",
    items: ["Whey protein", "Banana", "Oats"],
  },
  {
    name: "Dinner Plate",
    time: "19:00",
    calories: 710,
    macros: "48g P · 70g C · 24g F",
    items: ["Salmon", "Jasmine rice", "Broccolini", "Olive oil"],
  },
];

export default function DietPage() {
  return (
    <main className="space-y-6 pt-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Diet</p>
        <h1 className="text-3xl font-semibold">Mock Meal Flow</h1>
        <p className="text-sm text-neutral-500">Static sample plan to explore the new visuals.</p>
      </header>

      <section className="rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-sm text-neutral-500">Daily Targets</p>
            <p className="text-xl font-semibold">2400 kcal · 180g protein</p>
          </div>
          <div className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-300">
            <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">80% complete</span>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">Mock Data</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
            <p className="text-neutral-500 text-xs">Calories</p>
            <p className="font-semibold">1,920 / 2,400</p>
          </div>
          <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
            <p className="text-neutral-500 text-xs">Protein</p>
            <p className="font-semibold">146 g</p>
          </div>
          <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
            <p className="text-neutral-500 text-xs">Carbs</p>
            <p className="font-semibold">216 g</p>
          </div>
          <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
            <p className="text-neutral-500 text-xs">Fat</p>
            <p className="font-semibold">52 g</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Meals</h2>
          <span className="text-xs rounded-full bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-neutral-600 dark:text-neutral-300">UI only</span>
        </div>
        <div className="space-y-3">
          {mockMealPlan.map((meal) => (
            <article
              key={meal.name}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">{meal.time}</p>
                  <h3 className="text-lg font-semibold">{meal.name}</h3>
                  <p className="text-sm text-neutral-500">{meal.macros}</p>
                </div>
                <span className="text-sm font-semibold">{meal.calories} kcal</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                {meal.items.map((item) => (
                  <span key={item} className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
