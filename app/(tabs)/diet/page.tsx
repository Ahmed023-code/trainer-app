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
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <header className="pt-4 space-y-3">
        {/* Date selector */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.05)] p-3">
            <div className="text-center">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {todayObj.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-lg font-semibold">
                {todayObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          <button className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <button className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium">
          Today
        </button>
      </header>

      {/* Macro Rings */}
      <div className="mt-3 flex justify-center">
        <div className="flex items-center gap-4">
          {/* Large calorie ring */}
          <MacroRing
            label="Cal"
            current={Math.round(totals.calories)}
            target={MOCK_GOALS.cal}
            color="var(--accent-diet)"
            size={120}
            strokeWidth={14}
          />

          {/* Smaller macro rings */}
          <div className="grid grid-cols-3 gap-3">
            <MacroRing
              label="P"
              current={Math.round(totals.protein)}
              target={MOCK_GOALS.p}
              color="#F87171"
              size={70}
              strokeWidth={6}
            />
            <MacroRing
              label="F"
              current={Math.round(totals.fat)}
              target={MOCK_GOALS.f}
              color="#FACC15"
              size={70}
              strokeWidth={6}
            />
            <MacroRing
              label="C"
              current={Math.round(totals.carbs)}
              target={MOCK_GOALS.c}
              color="#60A5FA"
              size={70}
              strokeWidth={6}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2 justify-center">
        <button className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium">
          Diet Details
        </button>
        <button className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium">
          Diet Settings
        </button>
      </div>

      {/* Meals list */}
      <section className="space-y-6 mt-4">
        {MOCK_MEALS.filter(meal => meal.items.length > 0).map((meal, i) => {
          const mealTotals = meal.items.reduce((sum, item) => ({
            calories: sum.calories + (item.calories * item.quantity),
            protein: sum.protein + (item.protein * item.quantity),
            carbs: sum.carbs + (item.carbs * item.quantity),
            fat: sum.fat + (item.fat * item.quantity),
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

          return (
            <div
              key={meal.name}
              className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{meal.name}</h3>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {Math.round(mealTotals.calories)} cal
                </div>
              </div>

              {/* Food items */}
              <div className="space-y-2">
                {meal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.03)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {item.quantity}x • {Math.round(item.calories * item.quantity)} cal
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        P: {Math.round(item.protein * item.quantity)}g • C: {Math.round(item.carbs * item.quantity)}g • F: {Math.round(item.fat * item.quantity)}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal totals */}
              <div className="mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Total:</span>
                  <div className="flex gap-4 font-medium">
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

        {/* Log Meal button */}
        <div className="flex items-center justify-center pt-4">
          <button className="px-8 py-3 rounded-full text-base font-semibold bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-accent-diet">
            + Log Meal
          </button>
        </div>
      </section>

      {/* FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)] text-accent-diet flex items-center justify-center">
          <span className="text-4xl leading-none font-bold" style={{ marginTop: '-2px' }}>+</span>
        </button>
      </div>
    </main>
  );
}

// Macro Ring Component
function MacroRing({
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
  const pct = Math.max(0, Math.min(1.5, target > 0 ? current / target : 0))
  const dash = circumference * pct

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
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
          <div className="text-lg font-bold">{current}</div>
          <div className="text-[9px] text-neutral-500 dark:text-neutral-400">of {target}</div>
          <div className="text-[8px] text-neutral-400 dark:text-neutral-500">{label}</div>
        </div>
      </div>
    </div>
  )
}
