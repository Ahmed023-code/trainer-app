'use client'

import { useMemo } from 'react'

// Mock data constants
const MOCK_TODAY = new Date().toISOString().split('T')[0]
const MOCK_EXERCISES = [
  {
    name: 'Bench Press',
    sets: [
      { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working', repsPerformed: 10 },
      { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working', repsPerformed: 9 },
      { weight: 185, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working', repsPerformed: 8 },
      { weight: 155, repsMin: 10, repsMax: 12, rpe: 7, type: 'Working', repsPerformed: 12 },
    ],
    notes: 'Felt strong today',
  },
  {
    name: 'Incline Dumbbell Press',
    sets: [
      { weight: 70, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working', repsPerformed: 12 },
      { weight: 70, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working', repsPerformed: 11 },
      { weight: 70, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working', repsPerformed: 10 },
    ],
    notes: '',
  },
  {
    name: 'Cable Flyes',
    sets: [
      { weight: 40, repsMin: 12, repsMax: 15, rpe: 7, type: 'Working', repsPerformed: 15 },
      { weight: 40, repsMin: 12, repsMax: 15, rpe: 7, type: 'Working', repsPerformed: 14 },
      { weight: 40, repsMin: 12, repsMax: 15, rpe: 7, type: 'Working', repsPerformed: 13 },
    ],
    notes: '',
  },
  {
    name: 'Tricep Pushdown',
    sets: [
      { weight: 60, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working', repsPerformed: 12 },
      { weight: 60, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working', repsPerformed: 11 },
      { weight: 60, repsMin: 10, repsMax: 12, rpe: 8, type: 'Working', repsPerformed: 10 },
    ],
    notes: '',
  },
  {
    name: 'Overhead Tricep Extension',
    sets: [
      { weight: 50, repsMin: 12, repsMax: 15, rpe: 7, type: 'Working', repsPerformed: 14 },
      { weight: 50, repsMin: 12, repsMax: 15, rpe: 7, type: 'Working', repsPerformed: 13 },
    ],
    notes: '',
  },
]
const MOCK_BODY_PARTS = { 'Chest': 10, 'Triceps': 8 }
const MOCK_WORKOUT_NOTES = 'Great chest and triceps session today. Feeling stronger on bench press.'

export default function WorkoutPage() {
  const todayObj = useMemo(() => new Date(MOCK_TODAY + 'T00:00:00'), [])

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

        {/* Body Part Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(MOCK_BODY_PARTS).map(([muscle, sets]) => (
            <div
              key={muscle}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-workout)] text-white text-sm font-medium"
            >
              <span>{muscle}</span>
              <span className="text-xs opacity-80">{sets} sets</span>
            </div>
          ))}
        </div>

        {/* Settings button */}
        <div className="flex justify-end">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent-workout)] text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Exercise list */}
      <section className="space-y-3 mt-4">
        {MOCK_EXERCISES.map((exercise, i) => (
          <div
            key={`${exercise.name}-${i}`}
            className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{exercise.name}</h3>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {exercise.sets.length} sets
              </div>
            </div>

            {/* Sets */}
            <div className="space-y-2">
              {exercise.sets.map((set, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.03)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Set {idx + 1}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex gap-3">
                      <span>{set.weight} lbs</span>
                      <span>×</span>
                      <span>{set.repsPerformed || set.repsMin} reps</span>
                      <span>@</span>
                      <span>RPE {set.rpe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Exercise notes */}
            {exercise.notes && (
              <div className="mt-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{exercise.notes}</div>
              </div>
            )}
          </div>
        ))}

        {/* Log Workout button */}
        <div className="flex items-center justify-center pt-4">
          <button className="px-8 py-3 rounded-full text-base font-semibold bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-[var(--accent-workout)]">
            + Log Workout
          </button>
        </div>
      </section>

      {/* Workout-level notes */}
      {MOCK_WORKOUT_NOTES && (
        <section className="mt-6">
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <label className="block text-sm font-medium mb-2">
              Workout Notes
            </label>
            <div className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)] px-3 py-2 text-sm">
              {MOCK_WORKOUT_NOTES}
            </div>
          </div>
        </section>
      )}

      {/* Clock button */}
      <div className="fixed right-24 bottom-24 z-[9400]">
        <button className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)] grid place-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)] text-[var(--accent-workout)] flex items-center justify-center">
          <span className="text-4xl leading-none font-bold" style={{ marginTop: '-2px' }}>+</span>
        </button>
      </div>
    </main>
  )
}
