'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getTodayISO } from '@/utils/completion'
import {
  readDiet,
  readWorkout,
  readWeight,
  writeWeight,
} from '@/stores/storageV2'
import { useInboxStore } from '@/stores/inboxStore'
import { useSettingsStore } from '@/stores/settingsStore'
import DaySelector from '@/components/ui/DaySelector'
import NutritionOverview from '@/components/diet/NutritionOverview'

// Load exercises data for body parts
// NOTE: Large datasets are now expected from external storage
// Set NEXT_PUBLIC_DATA_BASE_URL environment variable to point to your data hosting
let exercisesData: Array<{ name: string; bodyParts: string[] }> = []
if (typeof window !== 'undefined') {
  const dataBaseUrl = process.env.NEXT_PUBLIC_DATA_BASE_URL || ''
  const exercisesUrl = dataBaseUrl
    ? `${dataBaseUrl}/exercises.json`
    : '/data/exercises.json'

  fetch(exercisesUrl)
    .then((res) => {
      if (!res.ok) {
        console.warn(
          `Failed to load exercises data from ${exercisesUrl}. Please configure NEXT_PUBLIC_DATA_BASE_URL environment variable.`,
        )
        return null
      }
      return res.json()
    })
    .then((data) => {
      if (data) exercisesData = data
    })
    .catch(() => {})
}

// Get body parts for an exercise name
function getBodyPartsForExercise(exerciseName: string): string[] {
  const exercise = exercisesData.find((e) => e.name === exerciseName)
  return exercise?.bodyParts || []
}

// Aggregate body parts from workout
function getWorkoutBodyParts(exerciseNames: string[]): string {
  const bodyPartsSet = new Set<string>()
  exerciseNames.forEach((name) => {
    getBodyPartsForExercise(name).forEach((bp) => bodyPartsSet.add(bp))
  })

  const bodyParts = Array.from(bodyPartsSet)
  if (bodyParts.length === 0) return ''
  if (bodyParts.length <= 2) return bodyParts.join(' & ')
  return bodyParts.slice(0, 2).join(', ') + ` +${bodyParts.length - 2}`
}

const glassPanelClass =
  'relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl shadow-[0_18px_50px_-24px_rgba(15,23,42,0.7)]'

const glassChipClass =
  'rounded-2xl border border-white/20 bg-white/10 dark:bg-slate-900/50 backdrop-blur-xl shadow-[0_16px_40px_-24px_rgba(15,23,42,0.6)]'

const glassButtonClass =
  'tap-target inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/25 dark:bg-slate-900/60 backdrop-blur-xl text-xs font-semibold text-slate-900 dark:text-slate-100 px-3 py-1.5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-[1px] active:translate-y-0'

function GlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${glassPanelClass} ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.24),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(236,72,153,0.18),transparent_40%)] opacity-80" />
      <div className="relative">{children}</div>
    </div>
  )
}

function GlassButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${glassButtonClass} ${className}`} {...props}>
      {children}
    </button>
  )
}

function GlassCheckbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-0.5 h-4 w-4 rounded-md border border-white/30 bg-white/20 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_10px_24px_-14px_rgba(15,23,42,0.65)] text-accent-home focus:ring-2 focus:ring-sky-200/60 dark:focus:ring-sky-400/40 checked:bg-accent-home checked:border-accent-home"
    />
  )
}

export default function HomePage() {
  const router = useRouter()
  const todayISO = getTodayISO()
  const { weightUnit } = useSettingsStore()

  const todayObj = useMemo(() => new Date(todayISO + 'T00:00:00'), [todayISO])

  const goToToday = () => {
    window.location.reload()
  }

  const { reminders, addReminder, toggleReminder, removeReminder } =
    useInboxStore()

  const [weightValue, setWeightValue] = useState<string>('')
  const [weightHistory, setWeightHistory] = useState<number[]>([])
  const [savedWeight, setSavedWeight] = useState<number | null>(null)

  const [dietSummary, setDietSummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    goals: { cal: 2400, p: 180, c: 240, f: 70 },
  })
  const [workoutSummary, setWorkoutSummary] = useState({
    exerciseCount: 0,
    setCount: 0,
    exerciseNames: [] as string[],
  })

  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDue, setReminderDue] = useState('')

  const [showNutritionOverview, setShowNutritionOverview] = useState(false)

  useEffect(() => {
    const loadData = () => {
      const weight = readWeight(todayISO)
      setSavedWeight(weight)
      setWeightValue(weight !== null ? weight.toFixed(1) : '')

      const history: number[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(todayISO)
        d.setDate(d.getDate() - i)
        const w = readWeight(d.toISOString().split('T')[0])
        if (w !== null) history.push(w)
      }
      setWeightHistory(history.reverse())

      const diet = readDiet(todayISO)
      const totals = diet.meals.reduce(
        (acc, meal) => {
          return meal.items.reduce(
            (sum, item) => ({
              calories: sum.calories + item.calories * (item.quantity || 1),
              protein: sum.protein + item.protein * (item.quantity || 1),
              carbs: sum.carbs + item.carbs * (item.quantity || 1),
              fat: sum.fat + item.fat * (item.quantity || 1),
            }),
            acc,
          )
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      )

      setDietSummary({ ...totals, goals: diet.goals })

      const workout = readWorkout(todayISO)
      const setCount = workout.exercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets.filter((s) => s.type === 'Working' || s.type === 'Drop Set')
            .length,
        0,
      )

      setWorkoutSummary({
        exerciseCount: workout.exercises.length,
        setCount,
        exerciseNames: workout.exercises.map((ex) => ex.name),
      })
    }

    loadData()

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const diet = readDiet(todayISO)
        const totals = diet.meals.reduce(
          (acc, meal) => {
            return meal.items.reduce(
              (sum, item) => ({
                calories: sum.calories + item.calories * (item.quantity || 1),
                protein: sum.protein + item.protein * (item.quantity || 1),
                carbs: sum.carbs + item.carbs * (item.quantity || 1),
                fat: sum.fat + item.fat * (item.quantity || 1),
              }),
              acc,
            )
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        )
        setDietSummary({ ...totals, goals: diet.goals })
      }
    }

    const handleFocus = () => {
      const diet = readDiet(todayISO)
      const totals = diet.meals.reduce(
        (acc, meal) => {
          return meal.items.reduce(
            (sum, item) => ({
              calories: sum.calories + item.calories * (item.quantity || 1),
              protein: sum.protein + item.protein * (item.quantity || 1),
              carbs: sum.carbs + item.carbs * (item.quantity || 1),
              fat: sum.fat + item.fat * (item.quantity || 1),
            }),
            acc,
          )
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      )
      setDietSummary({ ...totals, goals: diet.goals })
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'diet-by-day-v2' || e.key === null) {
        const diet = readDiet(todayISO)
        const totals = diet.meals.reduce(
          (acc, meal) => {
            return meal.items.reduce(
              (sum, item) => ({
                calories: sum.calories + item.calories * (item.quantity || 1),
                protein: sum.protein + item.protein * (item.quantity || 1),
                carbs: sum.carbs + item.carbs * (item.quantity || 1),
                fat: sum.fat + item.fat * (item.quantity || 1),
              }),
              acc,
            )
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        )
        setDietSummary({ ...totals, goals: diet.goals })
      }
    }

    const handleDietGoalsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.dateISO === todayISO) {
        const diet = readDiet(todayISO)
        const totals = diet.meals.reduce(
          (acc, meal) => {
            return meal.items.reduce(
              (sum, item) => ({
                calories: sum.calories + item.calories * (item.quantity || 1),
                protein: sum.protein + item.protein * (item.quantity || 1),
                carbs: sum.carbs + item.carbs * (item.quantity || 1),
                fat: sum.fat + item.fat * (item.quantity || 1),
              }),
              acc,
            )
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        )
        setDietSummary({ ...totals, goals: diet.goals })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('dietGoalsUpdated', handleDietGoalsUpdated)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dietGoalsUpdated', handleDietGoalsUpdated)
    }
  }, [todayISO])

  const saveWeight = () => {
    const value = parseFloat(weightValue)
    if (!isNaN(value) && value > 0) {
      writeWeight(todayISO, value)
      setSavedWeight(value)
      setWeightValue(value.toFixed(1))
    }
  }

  const openDiet = () => {
    localStorage.setItem('ui-last-date-diet', todayISO)
    router.push(`/diet`)
  }

  const openWorkout = () => {
    localStorage.setItem('ui-last-date-workout', todayISO)
    router.push(`/workout`)
  }

  const handleAddReminder = () => {
    if (reminderTitle.trim()) {
      addReminder(reminderTitle, reminderDue || undefined)
      setReminderTitle('')
      setReminderDue('')
      setShowReminderModal(false)
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-[520px] px-3 pb-[calc(env(safe-area-inset-bottom)+80px)] pt-6 sm:px-4 space-y-4 text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.15),transparent_38%),radial-gradient(circle_at_10%_90%,rgba(168,85,247,0.14),transparent_40%)]" />

      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Today</div>
          <GlassButton onClick={goToToday} className="text-[11px] px-3 py-1">
            Refresh
          </GlassButton>
        </div>
        <GlassPanel className="p-2">
          <DaySelector
            dateISO={todayISO}
            dateObj={todayObj}
            onPrev={() => {}}
            onNext={() => {}}
            onSelect={() => {}}
            isToday={true}
            showNavigation={false}
            onGoToToday={goToToday}
            accentColor="var(--accent-home)"
            neomorphic={true}
          />
        </GlassPanel>
      </header>

      <GlassPanel>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold tracking-tight">Weight</label>
            <div className="text-xs text-slate-600 dark:text-slate-300">Last 7 days</div>
          </div>

          {savedWeight === null || parseFloat(weightValue) !== savedWeight ? (
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={() => {
                  const current = parseFloat(weightValue) || 0
                  const newValue = Math.max(0, current - 0.5)
                  setWeightValue(newValue.toFixed(1))
                }}
                className="h-10 w-10 rounded-2xl text-lg text-accent-home"
                aria-label="Decrease weight"
              >
                −
              </GlassButton>

              <div className="flex-1 min-w-0">
                <div
                  className={`${glassChipClass} flex items-center justify-center gap-2 px-4 py-2 cursor-pointer transition duration-200 hover:border-white/40`}
                  onClick={() => {
                    const input = document.getElementById(
                      'weight-input',
                    ) as HTMLInputElement | null
                    input?.focus()
                    input?.select()
                  }}
                >
                  <input
                    id="weight-input"
                    type="number"
                    step="0.1"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    className="w-full bg-transparent text-center text-2xl font-semibold tracking-tight focus:outline-none text-slate-900 dark:text-slate-50"
                    inputMode="decimal"
                  />
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {weightUnit}
                  </span>
                </div>
              </div>

              <GlassButton
                onClick={() => {
                  const current = parseFloat(weightValue) || 0
                  const newValue = current + 0.5
                  setWeightValue(newValue.toFixed(1))
                }}
                className="h-10 w-10 rounded-2xl text-lg text-accent-home"
                aria-label="Increase weight"
              >
                +
              </GlassButton>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`${glassChipClass} flex-1 px-4 py-3`}> 
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 mb-1">Current</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold leading-none">{weightValue}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{weightUnit}</span>
                </div>
              </div>
              <GlassButton
                onClick={() => setSavedWeight(null)}
                className="h-10 w-10 rounded-2xl"
                aria-label="Edit weight"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </GlassButton>
            </div>
          )}

          {(savedWeight === null || parseFloat(weightValue) !== savedWeight) && (
            <GlassButton onClick={saveWeight} className="w-full justify-center text-xs">
              Save Weight
            </GlassButton>
          )}

          {weightHistory.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              {weightHistory.map((w, idx) => (
                <div key={idx} className="flex flex-col items-center text-xs text-slate-600 dark:text-slate-300">
                  <div className="h-2 w-8 rounded-full bg-white/20 dark:bg-slate-800" />
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {w.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>

      <GlassPanel className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Diet Summary</h2>
          <GlassButton onClick={openDiet} className="text-[11px] text-accent-diet">
            Open Diet
          </GlassButton>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className={`${glassChipClass} p-3`}> 
              <CalorieRing
                current={Math.round(dietSummary.calories)}
                target={dietSummary.goals.cal}
                protein={Math.round(dietSummary.protein)}
                carbs={Math.round(dietSummary.carbs)}
                fat={Math.round(dietSummary.fat)}
                proteinTarget={dietSummary.goals.p}
                carbsTarget={dietSummary.goals.c}
                fatTarget={dietSummary.goals.f}
              />
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3">
            <SmallMacroRing
              label="Cal"
              current={Math.round(dietSummary.calories)}
              target={dietSummary.goals.cal}
              color="var(--accent-diet)"
            />
            <SmallMacroRing
              label="P"
              current={Math.round(dietSummary.protein)}
              target={dietSummary.goals.p}
              color="#F87171"
            />
            <SmallMacroRing
              label="F"
              current={Math.round(dietSummary.fat)}
              target={dietSummary.goals.f}
              color="#FACC15"
            />
            <SmallMacroRing
              label="C"
              current={Math.round(dietSummary.carbs)}
              target={dietSummary.goals.c}
              color="#60A5FA"
            />
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Workout Summary</h2>
          <GlassButton onClick={openWorkout} className="text-[11px] text-[var(--accent-workout)]">
            Open Workout
          </GlassButton>
        </div>

        {workoutSummary.exerciseCount > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div className={glassChipClass + ' p-3'}>
                <div className="text-3xl font-semibold leading-none">
                  {workoutSummary.exerciseCount}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Exercises</div>
              </div>
              <div className={glassChipClass + ' p-3'}>
                <div className="text-3xl font-semibold leading-none">{workoutSummary.setCount}</div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">Sets</div>
              </div>
            </div>
            {(() => {
              const bodyParts = getWorkoutBodyParts(workoutSummary.exerciseNames)
              return bodyParts ? (
                <div className="pt-4 border-t border-white/20 dark:border-white/10">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 mb-1">
                    Body Parts
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{bodyParts}</div>
                </div>
              ) : null
            })()}
          </>
        ) : (
          <div className="text-center py-6 text-sm text-slate-600 dark:text-slate-300">
            No workout logged
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Inbox</h2>
          <GlassButton onClick={() => setShowReminderModal(true)} className="text-[11px]">
            + New Reminder
          </GlassButton>
        </div>

        {reminders.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center py-4">
            No reminders yet
          </p>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`${glassChipClass} flex items-start gap-3 p-3`}
              >
                <GlassCheckbox
                  type="checkbox"
                  checked={reminder.done}
                  onChange={() => toggleReminder(reminder.id)}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      reminder.done
                        ? 'line-through text-slate-500/80 dark:text-slate-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {reminder.title}
                  </p>
                  {reminder.dueISO && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Due: {new Date(reminder.dueISO).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeReminder(reminder.id)}
                  className="text-slate-500 hover:text-red-500 transition-colors"
                  aria-label="Delete reminder"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {showReminderModal && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowReminderModal(false)}
        >
          <div
            className={`${glassPanelClass} max-w-md w-full p-6 border-white/30 bg-white/15 dark:bg-slate-900/50`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_70%_0%,rgba(56,189,248,0.18),transparent_35%)]" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">New Reminder</h3>
                <button
                  className="text-slate-500 hover:text-slate-200"
                  onClick={() => setShowReminderModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    Title
                  </label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    className={`${glassChipClass} w-full px-3 py-2 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200/70 dark:focus:ring-sky-400/50`}
                    placeholder="Hydrate, stretch, etc."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    value={reminderDue}
                    onChange={(e) => setReminderDue(e.target.value)}
                    className={`${glassChipClass} w-full px-3 py-2 border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200/70 dark:focus:ring-sky-400/50`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <GlassButton
                  onClick={() => setShowReminderModal(false)}
                  className="text-[11px] px-3 py-1 bg-white/10"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={handleAddReminder}
                  className="text-[11px] px-3 py-1 text-accent-home"
                >
                  Add Reminder
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNutritionOverview && (
        <NutritionOverview
          dateISO={todayISO}
          onClose={() => setShowNutritionOverview(false)}
          accentColor="var(--accent-diet)"
        />
      )}
    </main>
  )
}

function CalorieRing({
  current,
  target,
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: {
  current: number
  target: number
  protein: number
  carbs: number
  fat: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
}) {
  const size = 130
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const clamp = (value: number) => Math.max(0, Math.min(1.5, value))

  const calPct = clamp(target > 0 ? current / target : 0)
  const calDash = circumference * calPct

  const proteinPct = clamp(proteinTarget > 0 ? protein / proteinTarget : 0)
  const proteinDash = circumference * Math.min(1, proteinPct)
  const proteinOver = proteinPct > 1
  const proteinOverDash = circumference * Math.min(proteinPct - 1, 0.5)

  const fatPct = clamp(fatTarget > 0 ? fat / fatTarget : 0)
  const fatDash = circumference * Math.min(1, fatPct)
  const fatOver = fatPct > 1
  const fatOverDash = circumference * Math.min(fatPct - 1, 0.5)

  const carbsPct = clamp(carbsTarget > 0 ? carbs / carbsTarget : 0)
  const carbsDash = circumference * Math.min(1, carbsPct)
  const carbsOver = carbsPct > 1
  const carbsOverDash = circumference * Math.min(carbsPct - 1, 0.5)

  return (
    <div className="relative h-[150px] w-[150px]">
      <svg width={size} height={size} className="drop-shadow-[0_12px_35px_rgba(59,130,246,0.25)]">
        <defs>
          <linearGradient id="stripe-protein-home" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#FB923C" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FB923C" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="stripe-fat-home" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A3E635" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#A3E635" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#84CC16" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="stripe-carbs-home" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#stripe-protein-home)"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${proteinDash} ${circumference - proteinDash}`}
          strokeDashoffset={0}
          fill="none"
          opacity="0.9"
        />

        {proteinOver && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#stripe-protein-home)"
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${proteinOverDash} ${circumference - proteinOverDash}`}
            strokeDashoffset={proteinDash}
            fill="none"
            opacity="0.6"
          />
        )}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#A3E635"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${fatDash} ${circumference - fatDash}`}
          strokeDashoffset={-proteinDash}
          fill="none"
        />
        {fatOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#4D7C0F"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatOverDash} ${circumference - fatOverDash}`}
              strokeDashoffset={-(proteinDash + fatDash)}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-fat-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatOverDash} ${circumference - fatOverDash}`}
              strokeDashoffset={-(proteinDash + fatDash)}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#60A5FA"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${carbsDash} ${circumference - carbsDash}`}
          strokeDashoffset={-(proteinDash + fatDash)}
          fill="none"
        />
        {carbsOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3D7BC7"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsOverDash} ${circumference - carbsOverDash}`}
              strokeDashoffset={-(proteinDash + fatDash + carbsDash)}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-carbs-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsOverDash} ${circumference - carbsOverDash}`}
              strokeDashoffset={-(proteinDash + fatDash + carbsDash)}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{current}</div>
        <div className="text-[10px] text-slate-600 dark:text-slate-300">of {target}</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400">kcal</div>
      </div>
    </div>
  )
}

function SmallMacroRing({
  label,
  current,
  target,
  color,
}: {
  label: string
  current: number
  target: number
  color: string
}) {
  const size = 70
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const pct = Math.max(0, Math.min(1.5, target > 0 ? current / target : 0))
  const dash = circumference * pct

  const normalPct = Math.min(1, target > 0 ? current / target : 0)
  const normalDash = circumference * normalPct

  const diff = current - target
  const isOver = diff > 0
  const isUnder = diff < 0

  const getBgColor = () => {
    if (label === 'Cal') return '#34D3991F'
    if (label === 'P') return '#F871711F'
    if (label === 'F') return '#FACC151F'
    if (label === 'C') return '#60A5FA1F'
    return `${color}22`
  }

  return (
    <div className={`${glassChipClass} flex flex-col items-center gap-2 p-2 text-center`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="drop-shadow-[0_6px_18px_rgba(15,23,42,0.25)]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB55"
            strokeWidth={stroke}
            fill="none"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={0}
            fill="none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{label}</div>
          <div className="text-[9px] text-slate-600 dark:text-slate-300">{Math.round(pct * 100)}%</div>
        </div>
      </div>

      <div
        className="w-full rounded-full px-2 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-200"
        style={{ backgroundColor: getBgColor() }}
      >
        {Math.round(current)} / {Math.round(target)}
        <span className="ml-1 text-[9px] uppercase text-slate-500 dark:text-slate-300">
          {label === 'Cal' ? 'kcal' : 'g'}
        </span>
      </div>

      {isOver && (
        <div className="text-[10px] font-semibold text-emerald-500">+{Math.round(diff)}</div>
      )}
      {isUnder && (
        <div className="text-[10px] font-semibold text-orange-400">{Math.round(diff)}</div>
      )}
    </div>
  )
}
