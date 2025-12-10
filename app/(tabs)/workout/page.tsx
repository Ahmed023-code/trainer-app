'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import type { Exercise, Routine, SetItem } from '@/components/workout/types'
import ExerciseSection from '@/components/workout/ExerciseSection'
import ExerciseDetailModal from '@/components/workout/ExerciseDetailModal'
import ExerciseLibraryModal from '@/components/workout/ExerciseLibraryModal'
import RoutinesModal from '@/components/workout/RoutinesModal'
import ExerciseHistoryModal from '@/components/workout/ExerciseHistoryModal'
import ClockModal from '@/components/workout/ClockModal'
import BodyPartPills from '@/components/workout/BodyPartPills'
import DaySelector from '@/components/ui/DaySelector'
import { useDaySelector } from '@/hooks/useDaySelector'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { readWorkout, writeWorkout, getTodayISO } from '@/stores/storageV2'

const num = (v: any) => {
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

// Map arbitrary bodyPart strings to our groups
const mapBodyPartToGroup = (s: string): string | null => {
  const x = s.trim().toLowerCase()
  if (!x) return null
  if (/(quad|thigh)/.test(x)) return 'Quads'
  if (/(glute|glutes|butt)/.test(x)) return 'Glutes'
  if (/(hamstring|posterior chain)/.test(x)) return 'Hamstrings'
  if (/(calf|calves|gastrocnemius|soleus)/.test(x)) return 'Calves'
  if (/(chest|pec)/.test(x)) return 'Chest'
  if (/(back|lat|trap|rear delt|upper back|lats|traps)/.test(x)) return 'Back'
  if (/(shoulder|delts?)/.test(x)) return 'Shoulders'
  if (/(bicep)/.test(x)) return 'Biceps'
  if (/(tricep)/.test(x)) return 'Triceps'
  if (/(abs|core|oblique)/.test(x)) return 'Core'
  return null
}

const MUSCLE_ORDER = [
  'Quads',
  'Glutes',
  'Hamstrings',
  'Calves',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Core',
] as const

// Deep-copy a routine into exercises for today
const deepCopyRoutine = (r: Routine): Exercise[] =>
  r.exercises.map((e) => ({
    name: e.name,
    notes: (e as any).notes || '',
    sets: e.sets.map((s: any) => ({
      weight: num(s?.weight),
      repsMin:
        typeof s?.repsMin === 'number'
          ? s.repsMin
          : typeof s?.reps === 'number'
          ? s.reps
          : 10,
      repsMax:
        typeof s?.repsMax === 'number'
          ? s.repsMax
          : typeof s?.reps === 'number'
          ? s.reps
          : 10,
      rpe: typeof s?.rpe === 'number' ? s.rpe : 8,
      type: s?.type || 'Working',
      note: s?.note ?? '',
    })),
  }))

export default function WorkoutPage() {
  // Date selector
  const { dateISO, dateObj, goPrevDay, goNextDay, setDateISO, isToday } =
    useDaySelector('ui-last-date-workout')

  // Go to Today function
  const goToToday = () => {
    const today = getTodayISO()
    setDateISO(today)
    localStorage.setItem('ui-last-date-workout', today)
  }

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutNotes, setWorkoutNotes] = useState<string>('')

  // FAB + modals - unified workout log modal with tabs
  const [showWorkoutLog, setShowWorkoutLog] = useState(false)
  const [workoutLogTab, setWorkoutLogTab] = useState<'quick-add' | 'routines'>(
    'quick-add',
  )
  const [showHistory, setShowHistory] = useState(false)
  const [historyExerciseName, setHistoryExerciseName] = useState('')

  // Exercise detail modal
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null)

  // Clock modal
  const [showClock, setShowClock] = useState(false)

  // Library index: exercise name -> groups[]
  const [libIndex, setLibIndex] = useState<Record<string, string[]>>({})

  // Refs for scrolling to exercises
  const exerciseRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Build library index once
  useEffect(() => {
    ;(async () => {
      try {
        // NOTE: Large datasets are now expected from external storage
        // Set NEXT_PUBLIC_DATA_BASE_URL environment variable to point to your data hosting
        const dataBaseUrl = process.env.NEXT_PUBLIC_DATA_BASE_URL || ''
        const exercisesUrl = dataBaseUrl
          ? `${dataBaseUrl}/exercisedb-exercises.json`
          : '/data/exercisedb-exercises.json'

        const res = await fetch(exercisesUrl)
        if (!res.ok) {
          throw new Error(
            `Failed to load exercise data. Please configure NEXT_PUBLIC_DATA_BASE_URL environment variable.`,
          )
        }
        const json = await res.json()
        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.exercises)
          ? json.exercises
          : []
        const idx: Record<string, string[]> = {}
        for (const r of arr) {
          const name = String(r?.name || '')
            .toLowerCase()
            .trim()
          if (!name) continue
          // Use targetMuscles from the exercise data
          const targetMuscles: string[] = Array.isArray(r?.targetMuscles)
            ? r.targetMuscles
            : []
          if (targetMuscles.length) idx[name] = targetMuscles
        }
        setLibIndex(idx)
      } catch {
        setLibIndex({})
      }
    })()
  }, [])

  // Load data for selected date
  useEffect(() => {
    const state = readWorkout(dateISO)
    setExercises(state.exercises || [])
    setWorkoutNotes(state.notes || '')
  }, [dateISO])

  // Save data whenever exercises or notes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      writeWorkout(dateISO, { exercises, notes: workoutNotes })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [exercises, workoutNotes, dateISO])

  const addExercise = (ex: Exercise) => {
    // Mark quick-add exercises with source field
    const exerciseWithSource: Exercise = {
      ...ex,
      source: 'quick-add',
    }
    setExercises((prev) => [...prev, exerciseWithSource])
  }
  const updateExercise = (idx: number, next: Exercise) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? next : e)))
  }
  const deleteExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  // Add a set to an exercise
  const addSetToExercise = (exercise: Exercise) => {
    const idx = exercises.findIndex((e) => e.name === exercise.name)
    if (idx === -1) return

    const isQuickAdd = !exercise.source || exercise.source === 'quick-add'
    const prev = exercise.sets[exercise.sets.length - 1]
    let newSet: SetItem

    if (isQuickAdd) {
      // Quick-add: single reps value (repsMin = repsMax)
      newSet = prev
        ? { ...prev, repsPerformed: undefined }
        : { weight: 0, repsMin: 10, repsMax: 10, rpe: 8, type: 'Working' }
    } else {
      // Routine: clone with rep range preserved, reset repsPerformed
      newSet = prev
        ? { ...prev, repsPerformed: undefined }
        : { weight: 0, repsMin: 8, repsMax: 10, rpe: 8, type: 'Working' }
    }

    const updatedExercise = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    }
    updateExercise(idx, updatedExercise)
  }

  // Sets-by-muscle card data
  const setCounts = useMemo(() => {
    const base: Record<string, number> = {}

    for (const ex of exercises) {
      const nameKey = ex.name.toLowerCase().trim()

      // Get target muscles from library index
      const targetMuscles = libIndex[nameKey] || []

      if (!targetMuscles.length) continue

      const count = ex.sets.reduce((n, s: any) => {
        const t = String(s?.type || 'Working')
        return n + (t === 'Working' || t === 'Drop Set' ? 1 : 0)
      }, 0)

      // Only count the primary (first) target muscle
      if (count > 0) {
        const primaryMuscle = targetMuscles[0]
        base[primaryMuscle] = (base[primaryMuscle] ?? 0) + count
      }
    }

    return base
  }, [exercises, libIndex])

  // Prepare chart data for WorkoutMiniChart
  const chartData = useMemo(() => {
    return MUSCLE_ORDER.map((muscle) => ({
      label: muscle,
      value: setCounts[muscle] || 0,
    }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [setCounts])

  // Drag and drop for exercises
  const {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(exercises, setExercises)

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <header className="pt-4 space-y-3">
        {/* Date selector with full-width Today button */}
        <DaySelector
          dateISO={dateISO}
          dateObj={dateObj}
          onPrev={goPrevDay}
          onNext={goNextDay}
          onSelect={setDateISO}
          isToday={isToday}
          onGoToToday={goToToday}
          accentColor="var(--accent-workout)"
          fullWidthLayout={true}
        />

        {/* Body Part Pills showing muscles trained today */}
        <BodyPartPills setCounts={setCounts} />

        {/* Settings button below Today button, right-aligned */}
        <div className="flex justify-end">
          <a
            href={`/settings/workout?returnDate=${dateISO}`}
            className="tap-target w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent-workout)] text-white hover:opacity-90 transition-opacity shadow-sm"
            aria-label="Workout Settings"
          >
            <img src="/icons/fi-sr-settings.svg" alt="" className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Exercise list - compact summary cards */}
      <section className="space-y-3 relative z-10 mt-4">
        {exercises.map((ex, i) => (
          <div
            key={`${ex.name}-${i}`}
            ref={(el) => {
              exerciseRefs.current[ex.name] = el
            }}
            draggable
            onDragStart={handleDragStart(i)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter(i)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(i)}
            className={`rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4 overflow-visible cursor-move transition-all duration-200 ${
              draggedIndex === i
                ? 'opacity-50'
                : dragOverIndex === i
                ? 'scale-[1.02] shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.8)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)]'
                : ''
            }`}
            onClick={() => setSelectedExerciseIndex(i)}
          >
            <ExerciseSection
              exercise={ex}
              onClick={() => setSelectedExerciseIndex(i)}
              onDelete={() => deleteExercise(i)}
              onAddSet={addSetToExercise}
              onUpdateExercise={(updated) => updateExercise(i, updated)}
              currentDate={dateISO}
            />
          </div>
        ))}

        {/* Log Workout button always visible */}
        <div className="flex items-center justify-center pt-4">
          <button
            onClick={() => setShowWorkoutLog(true)}
            className="px-8 py-3 rounded-full text-base font-semibold bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-[var(--accent-workout)] transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
          >
            + Log Workout
          </button>
        </div>
      </section>

      {/* Workout-level notes */}
      {exercises.length > 0 && (
        <section className="mt-6 relative z-0">
          <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
            <label className="block text-sm font-medium mb-2">
              Workout Notes
            </label>
            <textarea
              className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)] px-3 py-2 resize-none border-none focus:outline-none focus:ring-2 focus:ring-accent-workout/30 transition-all duration-200"
              rows={3}
              placeholder="Add notes for today's workout..."
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
            />
          </div>
        </section>
      )}

      {/* Clock launcher button */}
      <div className="fixed right-24 bottom-24 z-[9400]">
        <button
          className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)] grid place-items-center transition-all duration-200 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]"
          aria-label="Clock"
          onClick={() => setShowClock(true)}
        >
          <img
            src="/icons/fi-sr-stopwatch.svg"
            alt=""
            className="w-5 h-5 dark:invert"
          />
        </button>
      </div>

      {/* FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button
          className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)] text-[var(--accent-workout)] flex items-center justify-center transition-all duration-200 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]"
          aria-label="Add"
          onClick={() => setShowWorkoutLog(true)}
        >
          <span
            className="text-4xl leading-none font-bold"
            style={{ marginTop: '-2px' }}
          >
            +
          </span>
        </button>
      </div>

      {/* Unified Workout Log - render appropriate modal based on tab */}
      {showWorkoutLog && workoutLogTab === 'quick-add' && (
        <ExerciseLibraryModal
          isOpen={true}
          onClose={() => setShowWorkoutLog(false)}
          onPick={(ex) => {
            addExercise(ex)
            setShowWorkoutLog(false)
          }}
          onSwitchToRoutines={() => setWorkoutLogTab('routines')}
        />
      )}

      {showWorkoutLog && workoutLogTab === 'routines' && (
        <RoutinesModal
          isOpen={true}
          onClose={() => setShowWorkoutLog(false)}
          onSaveRoutine={() => {}}
          onPickRoutine={(r) => {
            setExercises((prev) => [...prev, ...r.exercises])
            setShowWorkoutLog(false)
          }}
          onSwitchToQuickAdd={() => setWorkoutLogTab('quick-add')}
        />
      )}

      {/* Clock Modal */}
      <ClockModal isOpen={showClock} onClose={() => setShowClock(false)} />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        isOpen={selectedExerciseIndex !== null}
        exercise={
          selectedExerciseIndex !== null
            ? exercises[selectedExerciseIndex]
            : null
        }
        onClose={() => setSelectedExerciseIndex(null)}
        onChange={(next) => {
          if (selectedExerciseIndex !== null) {
            updateExercise(selectedExerciseIndex, next)
          }
        }}
        onDelete={() => {
          if (selectedExerciseIndex !== null) {
            deleteExercise(selectedExerciseIndex)
            setSelectedExerciseIndex(null)
          }
        }}
        onHistory={() => {
          if (selectedExerciseIndex !== null) {
            setHistoryExerciseName(exercises[selectedExerciseIndex].name)
            setShowHistory(true)
          }
        }}
      />

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        exerciseName={historyExerciseName}
        dateISO={dateISO}
      />
    </main>
  )
}
