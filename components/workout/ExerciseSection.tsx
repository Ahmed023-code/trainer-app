'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Exercise, SetItem } from '@/components/workout/types'
import ExerciseGif from '@/components/workout/ExerciseGif'
import { getMostRecentExercise, getTodayISO } from '@/stores/storageV2'

type Props = {
  exercise: Exercise
  onClick: () => void
  onDelete: () => void
  onAddSet?: (exercise: Exercise) => void
  onUpdateExercise?: (exercise: Exercise) => void
  currentDate?: string // Pass current date from parent to exclude it from history lookup
}

const getSetColor = (type: string): string => {
  switch (type) {
    case 'Warmup':
      return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
    case 'Working':
      return 'bg-[#8ff000]/20 dark:bg-[#8ff000]/10 border-[#8ff000]/40 dark:border-[#8ff000]/30 text-[#6bb000] dark:text-[#8ff000]'
    case 'Drop Set':
      return 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300'
    default:
      return 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800'
  }
}

const getSetTypeLabel = (type: string): string => {
  switch (type) {
    case 'Warmup':
      return 'Warm-up'
    case 'Working':
      return 'Working'
    case 'Drop Set':
      return 'Drop Set'
    default:
      return type
  }
}

export default function ExerciseSection({
  exercise,
  onClick,
  onDelete,
  onAddSet,
  onUpdateExercise,
  currentDate,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get previous workout data for this exercise
  const previousExercise = useMemo(() => {
    const date = currentDate || getTodayISO()
    return getMostRecentExercise(exercise.name, date)
  }, [exercise.name, currentDate])
  const [setMenuOpen, setSetMenuOpen] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })

  // Refs for menu trigger buttons
  const menuBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const setMenuBtnRef = (idx: number) => (el: HTMLButtonElement | null) => {
    menuBtnRefs.current[idx] = el
  }

  const handleDelete = () => {
    setShowConfirm(false)
    onDelete()
  }

  const handleAddSet = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddSet) {
      onAddSet(exercise)
      if (!isExpanded) {
        setIsExpanded(true)
      }
    }
  }

  const updateSetField = (
    setIndex: number,
    field: keyof SetItem,
    value: string | number,
  ) => {
    if (!onUpdateExercise) return

    const isQuickAdd = !exercise.source || exercise.source === 'quick-add'
    const updatedSets = exercise.sets.map((set, idx) => {
      if (idx !== setIndex) return set

      const updated = { ...set }
      if (field === 'weight') {
        updated.weight = Number(value) || 0
      } else if (field === 'repsMin') {
        updated.repsMin = Math.max(0, Math.floor(Number(value) || 0))
        if (isQuickAdd) updated.repsMax = updated.repsMin
      } else if (field === 'repsMax') {
        updated.repsMax = Math.max(
          updated.repsMin,
          Math.floor(Number(value) || 0),
        )
      } else if (field === 'repsPerformed') {
        // Store actual reps performed for routine exercises
        ;(updated as any).repsPerformed = Math.max(
          0,
          Math.floor(Number(value) || 0),
        )
      } else if (field === 'rpe') {
        updated.rpe = Math.max(0, Math.min(10, Number(value) || 0))
      } else if (field === 'type') {
        updated.type = String(value) as SetItem['type']
      }
      return updated
    })

    onUpdateExercise({ ...exercise, sets: updatedSets })
  }

  const deleteSet = (setIndex: number) => {
    if (!onUpdateExercise) return
    const updatedSets = exercise.sets.filter((_, idx) => idx !== setIndex)
    onUpdateExercise({ ...exercise, sets: updatedSets })
  }

  // Calculate set summary by type
  const setSummary = useMemo(() => {
    const warmup = exercise.sets.filter((s) => s.type === 'Warmup').length
    const working = exercise.sets.filter((s) => s.type === 'Working').length
    const dropSet = exercise.sets.filter((s) => s.type === 'Drop Set').length
    return { warmup, working, dropSet }
  }, [exercise.sets])

  // Function to open menu with position calculation
  const openSetMenu = (idx: number) => {
    const r = menuBtnRefs.current[idx]?.getBoundingClientRect()
    if (!r) return

    const menuWidth = 160
    const menuHeight = 100 // approximate
    const spacing = 8

    // Position below and to the right of button
    let top = r.bottom + spacing
    let left = r.right - menuWidth

    // Keep on screen
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < spacing) left = spacing
    if (left + menuWidth > viewportWidth - spacing)
      left = viewportWidth - menuWidth - spacing
    if (top + menuHeight > viewportHeight - spacing)
      top = r.top - menuHeight - spacing
    if (top < spacing) top = spacing

    setMenuPos({ top, left })
    setSetMenuOpen(idx)
  }

  // Escape key and scroll handler for 3-dot menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && setMenuOpen !== null) {
        setSetMenuOpen(null)
      }
    }
    const handleScroll = () => {
      if (setMenuOpen !== null) {
        setSetMenuOpen(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true) // Use capture phase
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [setMenuOpen])

  return (
    <>
      <section className="space-y-3 overflow-visible">
        {/* Exercise header */}
        <div className="w-full flex items-start gap-3">
          {/* Left: GIF Preview and Exercise info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Circular GIF Preview */}
            {(exercise as any).gifUrl && (
              <div className="flex-shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-sm">
                <ExerciseGif
                  gifUrl={(exercise as any).gifUrl}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{exercise.name}</h3>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                {[
                  setSummary.warmup > 0 && (
                    <span
                      key="warmup"
                      className="text-blue-700 dark:text-blue-400 font-medium"
                    >
                      {setSummary.warmup} Warm-up
                    </span>
                  ),
                  setSummary.working > 0 && (
                    <span
                      key="working"
                      className="text-[#6bb000] dark:text-[#8ff000] font-medium"
                    >
                      {setSummary.working} Working
                    </span>
                  ),
                  setSummary.dropSet > 0 && (
                    <span
                      key="drop"
                      className="text-violet-700 dark:text-violet-400 font-medium"
                    >
                      {setSummary.dropSet} Drop Set
                    </span>
                  ),
                ]
                  .filter(Boolean)
                  .map((item, idx, arr) => (
                    <span key={idx}>
                      {item}
                      {idx < arr.length - 1 && (
                        <span className="mx-1.5">·</span>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Right: Chevron, Plus, and Trash buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {/* Chevron button for expand/collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm"
              aria-label={
                isExpanded
                  ? `Collapse ${exercise.name}`
                  : `Expand ${exercise.name}`
              }
              aria-expanded={isExpanded}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Plus button for adding set */}
            {onAddSet && (
              <button
                onClick={handleAddSet}
                className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-workout)] text-black hover:opacity-90 transition-opacity shadow-sm"
                aria-label={`Add set to ${exercise.name}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5"
                >
                  <path
                    d="M8 3V13M3 8H13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirm(true)
              }}
              className="tap-target w-9 h-9 flex items-center justify-center rounded-full border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shadow-sm"
              aria-label={`Delete ${exercise.name}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className="w-3.5 h-3.5"
              >
                <path
                  d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded sets section */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {exercise.sets && exercise.sets.length > 0 ? (
            <div className="space-y-5 px-2">
              {/* Column headers */}
              <div className="grid grid-cols-[minmax(24px,30px),minmax(80px,90px),minmax(50px,70px),minmax(50px,1fr),minmax(40px,50px),minmax(36px,50px)] gap-1 px-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                <div className="text-center">Set</div>
                <div className="text-center">Type</div>
                <div className="text-center">lbs</div>
                <div className="text-center">Reps</div>
                <div className="text-center">RPE</div>
                <div></div>
              </div>

              {/* Sets list - pill-shaped rows */}
              <div className="space-y-3">
                {exercise.sets.map((s, i) => {
                  const isQuickAdd =
                    !exercise.source || exercise.source === 'quick-add'
                  const hasRepValue =
                    (s as any).repsPerformed !== undefined &&
                    (s as any).repsPerformed !== null &&
                    (s as any).repsPerformed !== ''
                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-[minmax(24px,30px),minmax(80px,90px),minmax(50px,70px),minmax(50px,1fr),minmax(40px,50px),minmax(36px,50px)] gap-1 items-center rounded-full border px-1 py-1 ${getSetColor(
                        s.type,
                      )}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Set number */}
                      <span className="text-sm font-semibold tabular-nums text-center shrink-0">
                        #{i + 1}
                      </span>

                      {/* Type select with dark background */}
                      <select
                        value={s.type}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateSetField(i, 'type', e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-medium px-2 py-2 rounded-full bg-white/70 dark:bg-black/30 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400 min-w-0"
                      >
                        <option value="Warmup">Warm-up</option>
                        <option value="Working">Working</option>
                        <option value="Drop Set">Drop Set</option>
                      </select>

                      {/* Weight input */}
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={s.weight === 0 ? '' : String(s.weight)}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateSetField(i, 'weight', e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium tabular-nums px-2 py-2 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400 min-w-0"
                        placeholder={previousExercise?.sets?.[i]?.weight ? String(previousExercise.sets[i].weight) : "0"}
                      />

                      {/* Reps input - show performed with faded range behind */}
                      <div className="relative flex items-center justify-center min-w-[50px]">
                        {isQuickAdd ? (
                          // Quick-add: direct reps entry
                          <input
                            inputMode="numeric"
                            value={s.repsMin === 0 ? '' : String(s.repsMin)}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateSetField(i, 'repsMin', e.target.value)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm font-medium tabular-nums px-2 py-2 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                            placeholder={previousExercise?.sets?.[i]?.repsMin ? String(previousExercise.sets[i].repsMin) : ""}
                          />
                        ) : (
                          <>
                            {/* Faded rep range behind - hide when user types or when previous data exists */}
                            {!hasRepValue && s.repsMin > 0 && s.repsMax > 0 && !previousExercise?.sets?.[i] && (
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 pointer-events-none tabular-nums">
                                {s.repsMin}-{s.repsMax}
                              </span>
                            )}
                            {/* Actual reps performed in front */}
                            <input
                              inputMode="numeric"
                              value={
                                (s as any).repsPerformed !== undefined
                                  ? String((s as any).repsPerformed)
                                  : ''
                              }
                              onChange={(e) => {
                                e.stopPropagation()
                                updateSetField(
                                  i,
                                  'repsPerformed',
                                  e.target.value,
                                )
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="relative w-full text-sm font-medium tabular-nums px-2 py-2 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                              placeholder={previousExercise?.sets?.[i] && (previousExercise.sets[i] as any).repsPerformed !== undefined ? String((previousExercise.sets[i] as any).repsPerformed) : (previousExercise?.sets?.[i]?.repsMin ? String(previousExercise.sets[i].repsMin) : "")}
                            />
                          </>
                        )}
                      </div>

                      {/* RPE input - smaller for single digit with decimal */}
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        inputMode="decimal"
                        value={s.rpe === 0 ? '' : String(s.rpe)}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateSetField(i, 'rpe', e.target.value)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-sm font-medium tabular-nums px-1 py-2 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        placeholder={previousExercise?.sets?.[i]?.rpe ? String(previousExercise.sets[i].rpe) : "8"}
                      />

                      {/* 3-dot menu for set options */}
                      {onUpdateExercise && (
                        <div className="relative flex items-center justify-center">
                          <button
                            ref={setMenuBtnRef(i)}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (setMenuOpen === i) {
                                setSetMenuOpen(null)
                              } else {
                                openSetMenu(i)
                              }
                            }}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label={`Options for set ${i + 1}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              className="w-4 h-4"
                            >
                              <circle
                                cx="8"
                                cy="3"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="8"
                                cy="8"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="8"
                                cy="13"
                                r="1.5"
                                fill="currentColor"
                              />
                            </svg>
                          </button>

                          {/* 3-dot menu popup */}
                          {setMenuOpen === i &&
                            typeof document !== 'undefined' &&
                            createPortal(
                              <>
                                {/* Backdrop to close menu */}
                                <button
                                  className="fixed inset-0 z-[9996]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSetMenuOpen(null)
                                  }}
                                  aria-label="Close menu"
                                />
                                {/* Rectangular menu with pill buttons positioned near button */}
                                <div
                                  className="fixed z-[9997] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-3 min-w-[160px] space-y-2"
                                  style={{
                                    top: `${menuPos.top}px`,
                                    left: `${menuPos.left}px`,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSetMenuOpen(null)
                                      onClick() // Opens the full exercise view
                                    }}
                                    className="w-full px-4 py-2 rounded-full text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                  >
                                    Edit Set
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSetMenuOpen(null)
                                      deleteSet(i)
                                    }}
                                    className="w-full px-4 py-2 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                  >
                                    Delete Set
                                  </button>
                                </div>
                              </>,
                              document.body,
                            )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-neutral-400 dark:text-neutral-500">
              No sets added yet
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      {showConfirm &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            <button
              className="fixed inset-0 z-[9998] bg-black/20 dark:bg-black/40"
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirm(false)
              }}
              aria-label="Cancel"
            />
            {/* Dialog */}
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold text-lg mb-2">Delete Exercise?</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                  Are you sure you want to delete "{exercise.name}"? This will
                  remove all {exercise.sets.length} set
                  {exercise.sets.length === 1 ? '' : 's'} and cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowConfirm(false)
                    }}
                    className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
