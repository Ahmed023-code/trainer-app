"use client";

import { useState, useMemo } from "react";

// Mock data constants
const MOCK_TODAY = new Date().toISOString().split('T')[0]
const MOCK_WEIGHT = 185.5
const MOCK_DIET_SUMMARY = { calories: 1850, protein: 145, carbs: 180, fat: 55, goals: { cal: 2400, p: 180, c: 240, f: 70 } }
const MOCK_WORKOUT_SUMMARY = { exerciseCount: 5, setCount: 18 }

export default function ProgressPage() {
  const [view, setView] = useState<'day' | 'week' | 'month' | '3months' | 'year'>('day')
  const todayObj = useMemo(() => new Date(MOCK_TODAY + 'T00:00:00'), [])

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header with period navigation */}
      <header className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <button className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex-1 text-center font-medium">
            {todayObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          <button className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* View selector and Go to Today button */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
            {(['day', 'week', 'month', '3months', 'year'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-2 rounded-full text-xs font-medium transition-colors ${view === v ? "bg-[var(--accent-progress)] text-white" : "text-neutral-600 dark:text-neutral-400"}`}
              >
                {v === '3months' ? '3M' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-[var(--accent-progress)] text-white text-sm font-medium whitespace-nowrap">
            Today
          </button>
        </div>
      </header>

      {/* Day View Content */}
      {view === 'day' && (
        <div className="mt-4 space-y-4">
          {/* Weight card */}
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <h3 className="font-semibold mb-3">Weight</h3>
            <div className="text-3xl font-bold text-center">{MOCK_WEIGHT} lbs</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1">
              {todayObj.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
          </div>

          {/* Diet summary */}
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Diet</h3>
              <button className="text-xs text-accent-diet font-medium">Open Diet →</button>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-lg font-bold">{Math.round(MOCK_DIET_SUMMARY.calories)}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Cal</div>
              </div>
              <div>
                <div className="text-lg font-bold">{Math.round(MOCK_DIET_SUMMARY.protein)}g</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold">{Math.round(MOCK_DIET_SUMMARY.carbs)}g</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold">{Math.round(MOCK_DIET_SUMMARY.fat)}g</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Fat</div>
              </div>
            </div>
          </div>

          {/* Workout summary */}
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Workout</h3>
              <button className="text-xs text-[var(--accent-workout)] font-medium">Open Workout →</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{MOCK_WORKOUT_SUMMARY.exerciseCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{MOCK_WORKOUT_SUMMARY.setCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Sets</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="mt-4">
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <h3 className="font-semibold mb-4 text-center">Week View</h3>
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="aspect-square rounded-lg bg-neutral-200 dark:bg-neutral-700 p-2 flex flex-col items-center justify-center">
                  <div className="text-xs font-medium">{day}</div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">{i + 4}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="mt-4">
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <h3 className="font-semibold mb-4 text-center">Month View</h3>
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              Calendar grid would appear here
            </div>
          </div>
        </div>
      )}

      {/* 3 Months View */}
      {view === '3months' && (
        <div className="mt-4">
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <h3 className="font-semibold mb-4 text-center">3 Months View</h3>
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              3-month calendar view would appear here
            </div>
          </div>
        </div>
      )}

      {/* Year View */}
      {view === 'year' && (
        <div className="mt-4">
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <h3 className="font-semibold mb-4 text-center">Year View</h3>
            <div className="grid grid-cols-3 gap-3">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                <div key={i} className="aspect-square rounded-lg bg-neutral-200 dark:bg-neutral-700 p-2 flex items-center justify-center">
                  <div className="text-xs font-medium">{month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
