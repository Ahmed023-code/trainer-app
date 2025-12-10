'use client'

import {
  useState,
  useEffect,
  useMemo,
  type PropsWithChildren,
  type ButtonHTMLAttributes,
} from 'react'
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

const glassPanelBase =
  'relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-950/50 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.25)]'

function GlassCard({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`${glassPanelBase} ${className ?? ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-white/30 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-transparent" />
      <div className="pointer-events-none absolute inset-x-6 inset-y-0 opacity-[0.08] bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.9),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(52,211,153,0.65),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(248,113,113,0.75),transparent_30%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}

function GlassButton({
  children,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`relative isolate overflow-hidden rounded-full border border-white/50 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-white shadow-[0_8px_30px_rgba(15,23,42,0.25)] transition hover:shadow-[0_10px_40px_rgba(15,23,42,0.35)] active:scale-[0.99] backdrop-blur-xl ${className ?? ''}`}
      type={type}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 to-transparent opacity-80" />
      <span className="relative flex items-center justify-center gap-1.5">{children}</span>
    </button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const todayISO = getTodayISO()
  const { weightUnit } = useSettingsStore()

  // Create Date object for today to use with DaySelector
  const todayObj = useMemo(() => new Date(todayISO + 'T00:00:00'), [todayISO])

  // Go to Today function (no-op for Home since it's always today, but needed for consistency)
  const goToToday = () => {
    // Home is always on today, but we reload data to ensure freshness
    window.location.reload()
  }

  const { reminders, addReminder, toggleReminder, removeReminder } =
    useInboxStore()

  // Weight state
  const [weightValue, setWeightValue] = useState<string>('')
  const [weightHistory, setWeightHistory] = useState<number[]>([])
  const [savedWeight, setSavedWeight] = useState<number | null>(null)

  // Diet/workout data
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

  // Reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDue, setReminderDue] = useState('')

  // Nutrition overview
  const [showNutritionOverview, setShowNutritionOverview] = useState(false)

  // Load data for today
  useEffect(() => {
    const loadData = () => {
      // Load weight
      const weight = readWeight(todayISO)
      setSavedWeight(weight)
      setWeightValue(weight !== null ? weight.toFixed(1) : '')

      // Load weight history (last 7 days)
      const history: number[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(todayISO)
        d.setDate(d.getDate() - i)
        const w = readWeight(d.toISOString().split('T')[0])
        if (w !== null) history.push(w)
      }
      setWeightHistory(history.reverse())

      // Load diet summary
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

      // Load workout summary
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

    // Reload diet goals when page becomes visible or storage changes
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

    // Custom event from updateDietGoals (same tab/window updates)
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

  // Save weight
  const saveWeight = () => {
    const value = parseFloat(weightValue)
    if (!isNaN(value) && value > 0) {
      writeWeight(todayISO, value)
      setSavedWeight(value)
      setWeightValue(value.toFixed(1))
    }
  }

  // Navigate to diet/workout with date
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
    <main className="relative mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(94,234,212,0.2),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(129,140,248,0.25),transparent_32%),radial-gradient(circle_at_30%_80%,rgba(248,113,113,0.2),transparent_30%)]" />
      <div className="relative space-y-5">
        {/* Header with date display */}
        <header className="pt-4">
          <GlassCard className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-200/70">
                  Today
                </p>
              </div>
              <GlassButton onClick={goToToday} className="px-3 py-1 text-xs">
                Refresh
              </GlassButton>
            </div>
            <div className="mt-2">
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
            </div>
          </GlassCard>
        </header>

        {/* Weight card */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-200/70">Body</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Weight</h2>
            </div>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.15)] dark:bg-white/10 dark:text-white">{weightUnit}</span>
          </div>

          {savedWeight === null || parseFloat(weightValue) !== savedWeight ? (
            <div className="mt-4 flex items-center gap-3">
              <GlassButton
                aria-label="Decrease weight"
                className="h-10 w-10 rounded-2xl px-0 text-lg text-[var(--accent-home)]"
                onClick={() => {
                  const current = parseFloat(weightValue) || 0
                  const newValue = Math.max(0, current - 0.5)
                  setWeightValue(newValue.toFixed(1))
                }}
              >
                −
              </GlassButton>

              <div className="flex-1">
                <div
                  className="group rounded-2xl border border-white/40 bg-white/70 px-4 py-2 text-center shadow-inner shadow-white/30 backdrop-blur-xl transition focus-within:border-[var(--accent-home)]/70 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40"
                  onClick={() => {
                    const input = document.getElementById(
                      'weight-input',
                    ) as HTMLInputElement
                    if (input) {
                      input.focus()
                      input.select()
                    }
                  }}
                >
                  <input
                    id="weight-input"
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    className="w-20 border-none bg-transparent text-2xl font-bold text-slate-900 outline-none selection:bg-[var(--accent-home)]/20 dark:text-white"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                    }}
                  />
                  <p className="text-xs text-slate-600 transition group-focus-within:text-[var(--accent-home)] dark:text-slate-300/80">
                    Tap to edit
                  </p>
                </div>
              </div>

              <GlassButton
                aria-label="Increase weight"
                className="h-10 w-10 rounded-2xl px-0 text-lg text-[var(--accent-home)]"
                onClick={() => {
                  const current = parseFloat(weightValue) || 0
                  const newValue = current + 0.5
                  setWeightValue(newValue.toFixed(1))
                }}
              >
                +
              </GlassButton>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/80 to-emerald-500/60 text-white shadow-[0_15px_40px_rgba(16,185,129,0.35)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>

              <div className="flex-1 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-center shadow-inner shadow-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {savedWeight.toFixed(1)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300/70">
                  Logged
                </div>
              </div>

              <GlassButton
                aria-label="Edit weight"
                className="h-10 w-10 rounded-2xl px-0 text-base"
                onClick={() => setSavedWeight(null)}
              >
                Edit
              </GlassButton>
            </div>
          )}

          {(savedWeight === null || parseFloat(weightValue) !== savedWeight) && (
            <div className="mt-4">
              <GlassButton
                className="w-full justify-center bg-gradient-to-r from-[var(--accent-home)]/90 via-white/40 to-[var(--accent-home)]/70 text-white shadow-[0_15px_45px_rgba(147,197,253,0.35)]"
                onClick={saveWeight}
              >
                Save weight
              </GlassButton>
            </div>
          )}
        </GlassCard>

        {/* Diet summary */}
        <GlassCard className="relative p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-200/70">Nutrition</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Diet Summary</h2>
            </div>
            <GlassButton
              className="bg-gradient-to-r from-[var(--accent-diet)]/80 to-white/70 text-slate-900 shadow-[0_12px_35px_rgba(248,113,113,0.35)]"
              onClick={openDiet}
            >
              Open Diet
            </GlassButton>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex-shrink-0">
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
        </GlassCard>
      {/* Workout summary */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-200/70">Training</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Workout Summary</h2>
            </div>
            <GlassButton
              className="bg-gradient-to-r from-[var(--accent-workout)]/80 to-white/70 text-slate-900 shadow-[0_12px_35px_rgba(94,234,212,0.3)]"
              onClick={openWorkout}
            >
              Open Workout
            </GlassButton>
          </div>

          {workoutSummary.exerciseCount > 0 ? (
            <>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 grid grid-cols-2 gap-3 rounded-2xl border border-white/40 bg-white/60 p-3 text-center shadow-inner shadow-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {workoutSummary.exerciseCount}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300/70">
                      Exercises
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {workoutSummary.setCount}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300/70">
                      Sets
                    </div>
                  </div>
                </div>
                <GlassButton
                  className="h-full min-w-[120px] flex-1 justify-center bg-gradient-to-br from-[var(--accent-home)]/90 via-white/40 to-[var(--accent-diet)]/80 text-white shadow-[0_15px_40px_rgba(59,130,246,0.35)]"
                  onClick={() => setShowNutritionOverview(true)}
                >
                  View Meals
                </GlassButton>
              </div>
              {(() => {
                const bodyParts = getWorkoutBodyParts(workoutSummary.exerciseNames)
                return bodyParts ? (
                  <div className="mt-4 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 shadow-inner shadow-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300/70">
                      Body Parts
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{bodyParts}</div>
                  </div>
                ) : null
              })()}
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/30 bg-white/50 px-4 py-6 text-center text-sm text-slate-600 shadow-inner shadow-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-200/80">
              No workout logged
            </div>
          )}
        </GlassCard>

      {/* Reminders inbox */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-200/70">Focus</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inbox</h2>
            </div>
            <GlassButton
              className="bg-gradient-to-r from-white/80 to-[var(--accent-home)]/70 text-slate-900 shadow-[0_12px_35px_rgba(14,165,233,0.25)] dark:text-white"
              onClick={() => setShowReminderModal(true)}
            >
              + New Reminder
            </GlassButton>
          </div>

          {reminders.length === 0 ? (
            <p className="py-5 text-center text-sm text-slate-600 dark:text-slate-200/80">
              No reminders yet
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="group flex items-start gap-3 rounded-2xl border border-white/40 bg-white/70 p-3 shadow-inner shadow-white/30 backdrop-blur-xl transition dark:border-white/10 dark:bg-white/5 dark:shadow-black/40"
                >
                  <input
                    type="checkbox"
                    checked={reminder.done}
                    onChange={() => toggleReminder(reminder.id)}
                    className="mt-1 h-5 w-5 rounded border-white/60 bg-white/70 text-[var(--accent-home)] shadow-inner shadow-white/40 focus:ring-2 focus:ring-[var(--accent-home)]/40 dark:border-white/20 dark:bg-white/5"
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p
                      className={`text-sm font-semibold ${
                        reminder.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {reminder.title}
                    </p>
                    {reminder.dueISO && (
                      <p className="text-xs text-slate-600 dark:text-slate-300/80">
                        Due: {new Date(reminder.dueISO).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeReminder(reminder.id)}
                    className="text-slate-400 transition hover:text-red-500 dark:hover:text-red-400"
                    aria-label="Delete reminder"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

      {/* New Reminder Modal */}
      {showReminderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur"
          onClick={() => setShowReminderModal(false)}
        >
          <GlassCard
            className="w-full max-w-md p-6 shadow-[0_30px_80px_rgba(15,23,42,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-200/70">Reminder</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">New Reminder</h3>
              </div>
              <GlassButton onClick={() => setShowReminderModal(false)} className="h-9 w-9 px-0 text-base">
                ✕
              </GlassButton>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-200/80">
                  Title
                </label>
                <div className="rounded-2xl border border-white/40 bg-white/70 px-3 py-2 shadow-inner shadow-white/30 backdrop-blur-xl focus-within:border-[var(--accent-home)]/70 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    className="w-full border-none bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-white"
                    placeholder="What should we remind you of?"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-200/80">
                  Due Date (Optional)
                </label>
                <div className="rounded-2xl border border-white/40 bg-white/70 px-3 py-2 shadow-inner shadow-white/30 backdrop-blur-xl focus-within:border-[var(--accent-home)]/70 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
                  <input
                    type="date"
                    value={reminderDue}
                    onChange={(e) => setReminderDue(e.target.value)}
                    className="w-full border-none bg-transparent text-sm font-medium text-slate-900 focus:outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <GlassButton
                  className="flex-1 justify-center bg-gradient-to-r from-[var(--accent-home)]/90 via-white/40 to-[var(--accent-diet)]/80 text-white shadow-[0_15px_45px_rgba(14,165,233,0.35)]"
                  onClick={() => {
                    if (reminderTitle.trim()) {
                      addReminder(reminderTitle, reminderDue || undefined)
                      setReminderTitle('')
                      setReminderDue('')
                      setShowReminderModal(false)
                    }
                  }}
                >
                  Add Reminder
                </GlassButton>
                <GlassButton
                  className="justify-center text-slate-700 dark:text-white"
                  onClick={() => {
                    setShowReminderModal(false)
                    setReminderTitle('')
                    setReminderDue('')
                  }}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
      {/* Nutrition Overview Modal */}
      <NutritionOverview
        isOpen={showNutritionOverview}
        meals={readDiet(todayISO).meals}
        goals={dietSummary.goals}
        dateISO={todayISO}
        onClose={() => setShowNutritionOverview(false)}
      />
    </main>
  )
}

// Large calorie ring component (similar to the one in NutritionOverview but simplified)
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
  const size = 140
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate calories from each macro
  const proteinCals = protein * 4
  const carbsCals = carbs * 4
  const fatCals = fat * 9
  const totalCals = proteinCals + carbsCals + fatCals

  // Calculate percentages of the ring based on caloric contribution
  const proteinPct = totalCals > 0 ? proteinCals / totalCals : 0.33
  const fatPct = totalCals > 0 ? fatCals / totalCals : 0.33
  const carbsPct = totalCals > 0 ? carbsCals / totalCals : 0.34

  // Ring circumference represents consumption relative to goal
  const fillPct = target > 0 ? current / target : 0
  const totalFill = fillPct <= 1 ? circumference * fillPct : circumference

  // Calculate dash lengths for each segment
  const proteinDash = totalFill * proteinPct
  const fatDash = totalFill * fatPct
  const carbsDash = totalFill * carbsPct

  // Check if each macro is over its target
  const proteinOver = protein > proteinTarget
  const carbsOver = carbs > carbsTarget
  const fatOver = fat > fatTarget

  // Calculate segment portions (normal vs overage)
  const getSegmentPortions = (
    curr: number,
    targ: number,
    totalDash: number,
  ) => {
    if (curr <= targ) {
      return { normalDash: totalDash, overageDash: 0 }
    }
    const normalPortion = targ / curr
    const normalDash = totalDash * normalPortion
    const overageDash = totalDash - normalDash
    return { normalDash, overageDash }
  }

  const proteinPortions = getSegmentPortions(
    protein,
    proteinTarget,
    proteinDash,
  )
  const fatPortions = getSegmentPortions(fat, fatTarget, fatDash)
  const carbsPortions = getSegmentPortions(carbs, carbsTarget, carbsDash)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] w-full h-full"
      >
        {/* Define stripe patterns for overage */}
        <defs>
          <pattern
            id="stripe-protein-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect
              width="1.5"
              height="3"
              fill="currentColor"
              className="text-white dark:text-black"
              opacity="0.5"
            />
          </pattern>
          <pattern
            id="stripe-fat-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect
              width="1.5"
              height="3"
              fill="currentColor"
              className="text-white dark:text-black"
              opacity="0.5"
            />
          </pattern>
          <pattern
            id="stripe-carbs-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect
              width="1.5"
              height="3"
              fill="currentColor"
              className="text-white dark:text-black"
              opacity="0.5"
            />
          </pattern>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={stroke}
          fill="none"
          className="text-neutral-400 dark:text-neutral-600"
        />

        {/* Protein segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F87171"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${proteinPortions.normalDash} ${
            circumference - proteinPortions.normalDash
          }`}
          strokeDashoffset="0"
          fill="none"
        />
        {/* Protein segment - overage portion */}
        {proteinOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#B84444"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${proteinPortions.overageDash} ${
                circumference - proteinPortions.overageDash
              }`}
              strokeDashoffset={-proteinPortions.normalDash}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-protein-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${proteinPortions.overageDash} ${
                circumference - proteinPortions.overageDash
              }`}
              strokeDashoffset={-proteinPortions.normalDash}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        {/* Fat segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FACC15"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${fatPortions.normalDash} ${
            circumference - fatPortions.normalDash
          }`}
          strokeDashoffset={-proteinDash}
          fill="none"
        />
        {/* Fat segment - overage portion */}
        {fatOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#C9A000"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatPortions.overageDash} ${
                circumference - fatPortions.overageDash
              }`}
              strokeDashoffset={-(proteinDash + fatPortions.normalDash)}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-fat-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatPortions.overageDash} ${
                circumference - fatPortions.overageDash
              }`}
              strokeDashoffset={-(proteinDash + fatPortions.normalDash)}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        {/* Carbs segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#60A5FA"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${carbsPortions.normalDash} ${
            circumference - carbsPortions.normalDash
          }`}
          strokeDashoffset={-(proteinDash + fatDash)}
          fill="none"
        />
        {/* Carbs segment - overage portion */}
        {carbsOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3D7BC7"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsPortions.overageDash} ${
                circumference - carbsPortions.overageDash
              }`}
              strokeDashoffset={
                -(proteinDash + fatDash + carbsPortions.normalDash)
              }
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-carbs-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsPortions.overageDash} ${
                circumference - carbsPortions.overageDash
              }`}
              strokeDashoffset={
                -(proteinDash + fatDash + carbsPortions.normalDash)
              }
              fill="none"
              opacity="0.6"
            />
          </g>
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {current}
        </div>
        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
          of {target}
        </div>
        <div className="text-[8px] text-neutral-400 dark:text-neutral-500">
          kcal
        </div>
      </div>
    </div>
  )
}

// Small macro ring component for the 2x2 grid
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

  // Allow ring to go beyond 100%, cap at 150% for visual display
  const pct = Math.max(0, Math.min(1.5, target > 0 ? current / target : 0))
  const dash = circumference * pct

  // Track if we're at or below 100%
  const normalPct = Math.min(1, target > 0 ? current / target : 0)
  const normalDash = circumference * normalPct

  // Calculate difference
  const diff = current - target
  const isOver = diff > 0
  const isUnder = diff < 0

  // Get background color based on label
  const getBgColor = () => {
    if (label === 'Cal') return '#34D3991F'
    if (label === 'P') return '#F871711F'
    if (label === 'F') return '#FACC151F'
    if (label === 'C') return '#60A5FA1F'
    return `${color}22`
  }

  // Get darker color for overage
  const getOverageColor = () => {
    if (label === 'Cal') return '#1F9D6D'
    if (label === 'P') return '#B84444'
    if (label === 'F') return '#C9A000'
    if (label === 'C') return '#3D7BC7'
    return color
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 rotate-[-90deg] w-full h-full"
        >
          {/* Define stripe pattern for overage */}
          <defs>
            <pattern
              id={`stripe-${label}-small`}
              patternUnits="userSpaceOnUse"
              width="3"
              height="3"
              patternTransform="rotate(45)"
            >
              <rect
                width="1.5"
                height="3"
                fill="currentColor"
                className="text-white dark:text-black"
                opacity="0.5"
              />
            </pattern>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth={stroke}
            fill="none"
            className="text-neutral-400 dark:text-neutral-600"
          />

          {/* Base progress ring - shows up to 100% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${normalDash} ${circumference - normalDash}`}
            fill="none"
          />

          {/* Overage portion - shows amount beyond 100% */}
          {current > target && (
            <g>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={getOverageColor()}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${
                  circumference - (dash - normalDash)
                }`}
                strokeDashoffset={-normalDash}
                fill="none"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#stripe-${label}-small)`}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${
                  circumference - (dash - normalDash)
                }`}
                strokeDashoffset={-normalDash}
                fill="none"
                opacity="0.6"
              />
            </g>
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="inline-grid place-items-center rounded-full font-extrabold text-[9px] leading-none"
            style={{
              width: 18,
              height: 18,
              backgroundColor: color,
              color: '#000',
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Value bubble under ring */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums whitespace-nowrap"
          style={{
            backgroundColor: getBgColor(),
            color: color,
          }}
        >
          {current}/{target}
        </span>
        {/* Difference indicator */}
        {diff !== 0 && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold gap-0.5"
            style={{
              backgroundColor: color,
              color: '#000',
            }}
          >
            <span className="text-[11px] font-black">{isOver ? '▲' : '▼'}</span>{' '}
            {Math.abs(Math.round(diff))}
            {label === 'Cal' ? 'cal' : 'g'}
          </span>
        )}
      </div>
    </div>
  )
}
