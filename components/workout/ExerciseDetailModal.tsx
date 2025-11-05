"use client";

import { useState, useEffect } from "react";
import type { Exercise, SetItem } from "@/components/workout/types";
import ExerciseGif from "@/components/workout/ExerciseGif";

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
          {/* Exercise name and info */}
          <div>
            <h2 className="font-semibold text-lg">{localExercise.name}</h2>
            {/* Target Muscles */}
            {Array.isArray((localExercise as any).targetMuscles) && (localExercise as any).targetMuscles.length > 0 && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                <span className="font-medium">Target:</span> {(localExercise as any).targetMuscles.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
              </div>
            )}
            {/* Secondary Muscles */}
            {Array.isArray((localExercise as any).secondaryMuscles) && (localExercise as any).secondaryMuscles.length > 0 && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="font-medium">Secondary:</span> {(localExercise as any).secondaryMuscles.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
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
          {/* Exercise GIF Display */}
          {(localExercise as any).gifUrl && (
            <div className="flex justify-center mb-4">
              <ExerciseGif
                gifUrl={(localExercise as any).gifUrl}
                alt={localExercise.name}
                className="w-[180px] h-[180px] rounded-lg"
              />
            </div>
          )}

          {/* Column headers */}
          <div className="grid grid-cols-[32px,90px,70px,1fr,40px,36px] gap-1 px-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            <div className="text-center">Set</div>
            <div className="text-center">Type</div>
            <div className="text-center">lbs</div>
            <div className="text-center">Reps</div>
            <div className="text-center">RPE</div>
            <div></div>
          </div>

          {/* Sets list - pill-shaped rows */}
          <div className="space-y-2">
            {localExercise.sets.map((s, i) => {
              const isQuickAdd = !localExercise.source || localExercise.source === "quick-add";
              const hasRepValue = (s as any).repsPerformed !== undefined && (s as any).repsPerformed !== null && (s as any).repsPerformed !== "";
              return (
                <div
                  key={i}
                  className={`grid grid-cols-[32px,90px,70px,1fr,40px,36px] gap-1 items-center rounded-full border px-2 py-2.5 ${getSetColor(s.type)}`}
                >
                  {/* Set number */}
                  <span className="text-sm font-semibold tabular-nums text-center shrink-0">
                    #{i + 1}
                  </span>

                  {/* Type select with dark background */}
                  <select
                    value={s.type}
                    onChange={(e) => updateSetField(i, "type", e.target.value)}
                    className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-800 dark:bg-neutral-700 text-white border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400 min-w-0"
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
                    value={s.weight === 0 ? "" : String(s.weight)}
                    onChange={(e) => updateSetField(i, "weight", e.target.value)}
                    className="text-sm font-medium tabular-nums px-2 py-1 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400 min-w-0"
                    placeholder="0"
                  />

                  {/* Reps input - show performed with faded range behind */}
                  <div className="relative flex items-center justify-center">
                    {isQuickAdd ? (
                      // Quick-add: direct reps entry
                      <input
                        inputMode="numeric"
                        value={s.repsMin === 0 ? "" : String(s.repsMin)}
                        onChange={(e) => updateSetField(i, "repsMin", e.target.value)}
                        className="w-full text-sm font-medium tabular-nums px-2 py-1 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        placeholder=""
                      />
                    ) : (
                      <>
                        {/* Faded rep range behind - always show if range exists */}
                        {s.repsMin > 0 && s.repsMax > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 pointer-events-none tabular-nums">
                            {s.repsMin}-{s.repsMax}
                          </span>
                        )}
                        {/* Actual reps performed in front */}
                        <input
                          inputMode="numeric"
                          value={(s as any).repsPerformed !== undefined ? String((s as any).repsPerformed) : ""}
                          onChange={(e) => updateSetField(i, "repsPerformed", e.target.value)}
                          className="relative w-full text-sm font-medium tabular-nums px-2 py-1 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                          placeholder=""
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
                    value={s.rpe === 0 ? "" : String(s.rpe)}
                    onChange={(e) => updateSetField(i, "rpe", e.target.value)}
                    className="w-full text-sm font-medium tabular-nums px-1 py-1 rounded-full bg-white/70 dark:bg-black/30 border-0 text-center focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    placeholder="8"
                  />

                  {/* Delete button - matches main workout page style */}
                  <button
                    onClick={() => deleteSet(i)}
                    className="tap-target w-9 h-9 shrink-0 flex items-center justify-center rounded-full border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shadow-sm"
                    aria-label="Delete set"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                      <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="space-y-2 pb-24">
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

        {/* Bottom buttons - sticky, pill-shaped to match meal view */}
        <div className="sticky bottom-0 z-10 p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-full bg-[#FACC15] text-black font-medium hover:bg-[#EAB308] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
