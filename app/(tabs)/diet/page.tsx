"use client";

import { useMemo } from "react";

// Mock data constants
const MOCK_TODAY = new Date().toISOString().split('T')[0]
const MOCK_GOALS = { cal: 2400, p: 180, c: 240, f: 70 }
const MOCK_MEALS = [
  {
    name: "Breakfast",
    items: [
      { name: "Scrambled Eggs", quantity: 1, calories: 180, protein: 13, carbs: 2, fat: 12 },
      { name: "Whole Wheat Toast", quantity: 2, calories: 160, protein: 6, carbs: 28, fat: 2 },
      { name: "Avocado", quantity: 0.5, calories: 120, protein: 1, carbs: 6, fat: 11 },
    ]
  },
  {
    name: "Lunch",
    items: [
      { name: "Grilled Chicken Breast", quantity: 1, calories: 284, protein: 53, carbs: 0, fat: 6 },
      { name: "Brown Rice", quantity: 1, calories: 216, protein: 5, carbs: 45, fat: 2 },
      { name: "Mixed Vegetables", quantity: 1, calories: 80, protein: 3, carbs: 16, fat: 1 },
    ]
  },
  {
    name: "Dinner",
    items: [
      { name: "Salmon Fillet", quantity: 1, calories: 367, protein: 40, carbs: 0, fat: 22 },
      { name: "Sweet Potato", quantity: 1, calories: 112, protein: 2, carbs: 26, fat: 0 },
      { name: "Green Beans", quantity: 1, calories: 44, protein: 2, carbs: 10, fat: 0 },
    ]
  },
  {
    name: "Snacks",
    items: [
      { name: "Greek Yogurt", quantity: 1, calories: 130, protein: 17, carbs: 9, fat: 4 },
      { name: "Almonds", quantity: 1, calories: 164, protein: 6, carbs: 6, fat: 14 },
    ]
  }
]

export default function DietPage() {
  const todayObj = useMemo(() => new Date(MOCK_TODAY + 'T00:00:00'), [])

  // Calculate totals
  const totals = useMemo(() => {
    return MOCK_MEALS.reduce((acc, meal) => {
      const mealTotals = meal.items.reduce((sum, item) => ({
        calories: sum.calories + (item.calories * item.quantity),
        protein: sum.protein + (item.protein * item.quantity),
        carbs: sum.carbs + (item.carbs * item.quantity),
        fat: sum.fat + (item.fat * item.quantity),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

      return {
        calories: acc.calories + mealTotals.calories,
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fat: acc.fat + mealTotals.fat,
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }, [])

  return (
    <main className="mx-auto w-full max-w-[520px] px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+96px)] space-y-5">
      {/* Header with M3 */}
      <header className="pt-6 space-y-4">
        <div className="m3-card bg-neutral-100 dark:bg-neutral-900 p-5">
          <div className="text-center">
            <div className="m3-label-large text-neutral-500 dark:text-neutral-400">
              {todayObj.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="m3-title-large font-semibold mt-1">
              {todayObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        <button className="m3-btn-outlined w-full border-accent-diet text-accent-diet">
          Today
        </button>
      </header>

      {/* M3 Macro Rings */}
      <div className="m3-card-filled bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="flex items-center gap-5">
          {/* Large calorie ring with M3 styling */}
          <div className="flex-shrink-0">
            <M3MacroRing
              label="Cal"
              current={Math.round(totals.calories)}
              target={MOCK_GOALS.cal}
              color="var(--accent-diet)"
              size={120}
              strokeWidth={12}
            />
          </div>

          {/* Smaller macro rings */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            <M3MacroRing
              label="P"
              current={Math.round(totals.protein)}
              target={MOCK_GOALS.p}
              color="#F87171"
              size={70}
              strokeWidth={6}
            />
            <M3MacroRing
              label="F"
              current={Math.round(totals.fat)}
              target={MOCK_GOALS.f}
              color="#FACC15"
              size={70}
              strokeWidth={6}
            />
            <M3MacroRing
              label="C"
              current={Math.round(totals.carbs)}
              target={MOCK_GOALS.c}
              color="#60A5FA"
              size={70}
              strokeWidth={6}
            />
          </div>
        </div>

        {/* M3 Action buttons */}
        <div className="mt-5 flex gap-3 justify-center">
          <button className="m3-btn-outlined flex-1 border-accent-diet text-accent-diet">
            Details
          </button>
          <button className="m3-btn-outlined flex-1 border-accent-diet text-accent-diet">
            Settings
          </button>
        </div>
      </div>

      {/* Meals list with M3 cards */}
      <section className="space-y-4">
        {MOCK_MEALS.filter(meal => meal.items.length > 0).map((meal, i) => {
          const mealTotals = meal.items.reduce((sum, item) => ({
            calories: sum.calories + (item.calories * item.quantity),
            protein: sum.protein + (item.protein * item.quantity),
            carbs: sum.carbs + (item.carbs * item.quantity),
            fat: sum.fat + (item.fat * item.quantity),
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

          return (
            <div key={meal.name} className="m3-card-filled bg-neutral-100 dark:bg-neutral-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="m3-title-medium font-semibold">{meal.name}</h3>
                <div className="m3-label-large text-neutral-600 dark:text-neutral-400">
                  {Math.round(mealTotals.calories)} cal
                </div>
              </div>

              {/* Food items */}
              <div className="space-y-2">
                {meal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="m3-surface-inset rounded-2xl bg-neutral-100 dark:bg-neutral-900 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="m3-body-medium font-medium">{item.name}</div>
                        <div className="m3-label-small text-neutral-500 dark:text-neutral-400">
                          {item.quantity}x • {Math.round(item.calories * item.quantity)} cal
                        </div>
                      </div>
                      <div className="m3-label-small text-neutral-500 dark:text-neutral-400">
                        P: {Math.round(item.protein * item.quantity)}g •
                        C: {Math.round(item.carbs * item.quantity)}g •
                        F: {Math.round(item.fat * item.quantity)}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal totals */}
              <div className="mt-4 pt-4 border-t border-neutral-300/30 dark:border-neutral-700/30">
                <div className="flex justify-between">
                  <span className="m3-label-medium text-neutral-500 dark:text-neutral-400">Total:</span>
                  <div className="flex gap-4 m3-label-medium font-semibold">
                    <span>{Math.round(mealTotals.calories)} cal</span>
                    <span>P: {Math.round(mealTotals.protein)}g</span>
                    <span>C: {Math.round(mealTotals.carbs)}g</span>
                    <span>F: {Math.round(mealTotals.fat)}g</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* M3 Log Meal button */}
        <div className="flex items-center justify-center pt-4">
          <button className="m3-btn-filled bg-neutral-200 dark:bg-neutral-800 text-accent-diet px-8">
            + Log Meal
          </button>
        </div>
      </section>

      {/* M3 FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button className="m3-fab bg-accent-diet text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </main>
  );
}

// M3 Macro Ring Component with Neomorphism
function M3MacroRing({
  label,
  current,
  target,
  color,
  size,
  strokeWidth,
}: {
  label: string
  current: number
  target: number
  color: string
  size: number
  strokeWidth: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, target > 0 ? current / target : 0))
  const dash = circumference * pct

  return (
    <div className="flex flex-col items-center">
      <div className="relative m3-elevation-1 rounded-full bg-neutral-100 dark:bg-neutral-900 p-2" style={{ width: size + 16, height: size + 16 }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-neutral-400 dark:text-neutral-600"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={size > 80 ? "m3-title-large font-bold" : "m3-body-large font-bold"}>{current}</div>
          <div className="m3-label-small text-neutral-500 dark:text-neutral-400">of {target}</div>
          <div className="m3-label-small text-neutral-400 dark:text-neutral-500">{label}</div>
        </div>
      </div>
    </div>
  )
}
