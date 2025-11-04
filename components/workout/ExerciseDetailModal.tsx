"use client";

import { useState, useEffect } from "react";
import type { Exercise, SetItem } from "@/components/workout/types";

type Props = {
  isOpen: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onChange: (next: Exercise) => void;
  onDelete: () => void;
  onHistory?: () => void;
};

const keepNum = (v: any) => Math.max(0, Math.floor(Number(v) || 0));

const getSetColor = (type: string): string => {
  switch (type) {
    case "Warmup":
      return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700";
    case "Working":
      return "bg-[#8ff000]/20 dark:bg-[#8ff000]/10 border-[#8ff000]/40 dark:border-[#8ff000]/30";
    case "Drop Set":
      return "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700";
    default:
      return "bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800";
  }
};

export default function ExerciseDetailModal({
  isOpen,
  exercise,
  onClose,
  onChange,
  onDelete,
  onHistory,
}: Props) {
  // Local state to track changes before saving
  const [localExercise, setLocalExercise] = useState<Exercise | null>(null);

  // Initialize local state when modal opens or exercise changes
  useEffect(() => {
    if (isOpen && exercise) {
      setLocalExercise(JSON.parse(JSON.stringify(exercise))); // Deep copy
    }
  }, [isOpen, exercise]);

  if (!isOpen || !localExercise) return null;

  // Determine if this is a quick-add exercise (default) or from a routine
  const isQuickAdd = !localExercise.source || localExercise.source === "quick-add";
  const isRoutine = localExercise.source === "routine";

  const updateSetField = (i: number, field: keyof SetItem, value: string | number) => {
    const next = { ...localExercise };
    const sets = next.sets.slice();
    const s = { ...sets[i] };
    if (field === "weight") s.weight = Number(value) || 0;
    else if (field === "repsMin") {
      s.repsMin = keepNum(value);
      // For quick-add, keep repsMin and repsMax in sync
      if (isQuickAdd) s.repsMax = s.repsMin;
    }
    else if (field === "repsMax") s.repsMax = Math.max(s.repsMin, keepNum(value));
    else if (field === "repsPerformed") {
      // Store actual reps performed for routine exercises
      s.repsPerformed = keepNum(value);
    }
    else if (field === "rpe") s.rpe = Math.max(0, Math.min(10, Number(value) || 0));
    else if (field === "type") s.type = String(value) as SetItem["type"];
    sets[i] = s;
    next.sets = sets;
    setLocalExercise(next);
  };

  const deleteSet = (idx: number) => {
    const next = { ...localExercise, sets: localExercise.sets.filter((_, i) => i !== idx) };
    setLocalExercise(next);
  };

  const addSet = () => {
    const prev = localExercise.sets[localExercise.sets.length - 1];
    let clone: SetItem;
    if (isQuickAdd) {
      // Quick-add: single reps value (repsMin = repsMax)
      clone = prev
        ? { ...prev, repsPerformed: undefined }
        : { weight: 0, repsMin: 10, repsMax: 10, rpe: 8, type: "Working" };
    } else {
      // Routine: clone with rep range preserved, reset repsPerformed
      clone = prev
        ? { ...prev, repsPerformed: undefined }
        : { weight: 0, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" };
    }
    const next = { ...localExercise, sets: [...localExercise.sets, clone] };
    setLocalExercise(next);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSave = () => {
    onChange(localExercise);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9600]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
        aria-label="Close"
        onClick={handleCancel}
      />

      {/* Modal content */}
      <div className="absolute inset-0 bg-white dark:bg-neutral-900 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-full bg-[#FACC15] text-black font-medium hover:bg-[#EAB308] transition-colors"
              onClick={handleSave}
            >
              Save
            </button>
          </div>

          {/* Exercise name and info */}
          <div>
            <h2 className="font-semibold text-lg">{localExercise.name}</h2>
            {Array.isArray((localExercise as any).bodyParts) && (localExercise as any).bodyParts.length > 0 && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Muscles: {(localExercise as any).bodyParts.join(", ")}
              </div>
            )}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {localExercise.sets.length} set{localExercise.sets.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2 mt-2">
            {onHistory && (
              <button
                onClick={onHistory}
                className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="View history"
              >
                📊 History
              </button>
            )}
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Delete Exercise
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Column headers - unified layout optimized for narrow screens */}
          <div className="grid grid-cols-[28px,85px,65px,1fr,52px,36px] gap-1 px-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <div className="text-center">#</div>
            <div className="text-center">Type</div>
            <div className="text-center">lbs</div>
            <div className="text-center">Reps</div>
            <div className="text-center">RPE</div>
            <div></div>
          </div>

          {/* Sets list - compact single-line rows */}
          <div className="space-y-2">
            {localExercise.sets.map((s, i) => {
              // Generate placeholder text for routine exercises showing target range
              const repsPlaceholder = isRoutine
                ? s.repsMin === s.repsMax
                  ? `${s.repsMin}`
                  : `${s.repsMin}–${s.repsMax}`
                : "10";

              return (
                <div
                  key={i}
                  className={`grid grid-cols-[28px,85px,65px,1fr,52px,36px] gap-1 items-center rounded-full border px-1 py-1.5 ${getSetColor(s.type)}`}
                >
                  {/* Set number */}
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 text-center">
                    {i + 1}
                  </span>

                  {/* Type select */}
                  <select
                    className="text-[11px] rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 min-w-0"
                    value={s.type}
                    onChange={(e) => updateSetField(i, "type", e.target.value)}
                  >
                    <option value="Working">Working</option>
                    <option value="Warmup">Warmup</option>
                    <option value="Drop Set">Drop Set</option>
                  </select>

                  {/* Weight input */}
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    className="text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                    value={s.weight === 0 ? "" : String(s.weight)}
                    onChange={(e) => updateSetField(i, "weight", e.target.value)}
                    placeholder="0"
                  />

                  {/* Unified Reps input */}
                  {isQuickAdd ? (
                    // Quick-add: direct reps entry
                    <input
                      inputMode="numeric"
                      className="text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                      value={String(s.repsMin)}
                      onChange={(e) => updateSetField(i, "repsMin", e.target.value)}
                      placeholder={repsPlaceholder}
                    />
                  ) : (
                    // Routine: show repsPerformed with target range as placeholder
                    <input
                      inputMode="numeric"
                      className="text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                      value={s.repsPerformed !== undefined ? String(s.repsPerformed) : ""}
                      onChange={(e) => updateSetField(i, "repsPerformed", e.target.value)}
                      placeholder={repsPlaceholder}
                    />
                  )}

                  {/* RPE input */}
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    inputMode="decimal"
                    className="text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                    value={s.rpe === 0 ? "" : String(s.rpe)}
                    onChange={(e) => updateSetField(i, "rpe", e.target.value)}
                    placeholder="8"
                  />

                  {/* Delete button */}
                  <button
                    onClick={() => deleteSet(i)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-red-600 dark:bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700"
                    aria-label="Delete set"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add set button */}
          <button
            onClick={addSet}
            className="w-full px-4 py-3 rounded-full bg-[#FACC15] text-black text-sm font-medium hover:bg-[#EAB308] transition-colors"
          >
            + Add Set
          </button>

          {/* Exercise notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Exercise Notes</label>
            <textarea
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 resize-none"
              rows={3}
              placeholder="Add notes about this exercise..."
              value={(localExercise as any).notes || ""}
              onChange={(e) => {
                const next: any = { ...localExercise, notes: e.target.value };
                setLocalExercise(next);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
