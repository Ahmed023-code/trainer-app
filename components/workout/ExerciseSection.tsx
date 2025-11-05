"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Exercise, SetItem } from "@/components/workout/types";
import ExerciseGif from "@/components/workout/ExerciseGif";

type Props = {
  exercise: Exercise;
  onClick: () => void;
  onDelete: () => void;
  onAddSet?: (exercise: Exercise) => void;
};

const getSetColor = (type: string): string => {
  switch (type) {
    case "Warmup":
      return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300";
    case "Working":
      return "bg-[#8ff000]/20 dark:bg-[#8ff000]/10 border-[#8ff000]/40 dark:border-[#8ff000]/30 text-[#6bb000] dark:text-[#8ff000]";
    case "Drop Set":
      return "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300";
    default:
      return "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800";
  }
};

const getSetTypeLabel = (type: string): string => {
  switch (type) {
    case "Warmup":
      return "W";
    case "Working":
      return "Work";
    case "Drop Set":
      return "Drop";
    default:
      return type.substring(0, 4);
  }
};

export default function ExerciseSection({ exercise, onClick, onDelete, onAddSet }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    setShowConfirm(false);
    onDelete();
  };

  const handleAddSet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddSet) {
      onAddSet(exercise);
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }
  };

  // Calculate set summary
  const setSummary = useMemo(() => {
    const workingSets = exercise.sets.filter(s => s.type === "Working" || s.type === "Drop Set").length;
    const warmupSets = exercise.sets.filter(s => s.type === "Warmup").length;
    return { total: exercise.sets.length, working: workingSets, warmup: warmupSets };
  }, [exercise.sets]);

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
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap bg-[#8ff000]/20 dark:bg-[#8ff000]/10 border border-[#8ff000]/40 dark:border-[#8ff000]/30 text-[#6bb000] dark:text-[#8ff000]">
                  {setSummary.working} working
                </span>
                {setSummary.warmup > 0 && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300">
                    {setSummary.warmup} warmup
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Chevron, Plus, and Trash buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {/* Chevron button for expand/collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm"
              aria-label={isExpanded ? `Collapse ${exercise.name}` : `Expand ${exercise.name}`}
              aria-expanded={isExpanded}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Plus button for adding set */}
            {onAddSet && (
              <button
                onClick={handleAddSet}
                className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-workout)] text-black hover:opacity-90 transition-opacity shadow-sm"
                aria-label={`Add set to ${exercise.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="tap-target w-9 h-9 flex items-center justify-center rounded-full border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shadow-sm"
              aria-label={`Delete ${exercise.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded sets section */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          {exercise.sets && exercise.sets.length > 0 ? (
            <div className="space-y-2">
              {exercise.sets.map((set, idx) => {
                const isQuickAdd = !exercise.source || exercise.source === "quick-add";
                const repsDisplay = isQuickAdd
                  ? `${set.repsMin}`
                  : set.repsPerformed !== undefined
                    ? `${set.repsPerformed}/${set.repsMin}-${set.repsMax}`
                    : `${set.repsMin}-${set.repsMax}`;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-full border ${getSetColor(set.type)}`}
                  >
                    {/* Left: Set number and type */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-semibold tabular-nums w-6">#{idx + 1}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">
                        {getSetTypeLabel(set.type)}
                      </span>
                      <span className="text-sm font-medium tabular-nums">{set.weight} lbs</span>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">×</span>
                      <span className="text-sm font-medium tabular-nums">{repsDisplay}</span>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">@</span>
                      <span className="text-sm font-medium tabular-nums">{set.rpe} RPE</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-neutral-400 dark:text-neutral-500">
              No sets added yet
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      {showConfirm && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <button
            className="fixed inset-0 z-[9998] bg-black/20 dark:bg-black/40"
            onClick={() => setShowConfirm(false)}
            aria-label="Cancel"
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 max-w-sm w-full">
              <h3 className="font-semibold text-lg mb-2">Delete Exercise?</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Are you sure you want to delete "{exercise.name}"? This will remove all {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"} and cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
