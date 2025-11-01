"use client";

import { useState } from "react";
import type { Exercise, SetItem } from "@/components/workout/types";

type Props = {
  exercise: Exercise;
  onChange: (next: Exercise) => void;
  onDelete: () => void;
  onHistory?: () => void;
};

const keepNum = (v: any) => Math.max(0, Math.floor(Number(v) || 0));

export default function ExerciseSection({ exercise, onChange, onDelete, onHistory }: Props) {
  const updateSetField = (i: number, field: keyof SetItem, value: string | number) => {
    const next = { ...exercise };
    const sets = next.sets.slice();
    const s = { ...sets[i] };
    if (field === "weight") s.weight = Number(value) || 0;
    else if (field === "repsMin") s.repsMin = keepNum(value);
    else if (field === "repsMax") s.repsMax = Math.max(s.repsMin, keepNum(value));
    else if (field === "rpe") s.rpe = Math.max(0, Math.min(10, Number(value) || 0));
    else if (field === "type") s.type = String(value) as SetItem["type"];
    sets[i] = s;
    next.sets = sets;
    onChange(next);
  };

  const deleteSet = (idx: number) => {
    const next = { ...exercise, sets: exercise.sets.filter((_, i) => i !== idx) };
    onChange(next);
  };

  const addSet = () => {
    const prev = exercise.sets[exercise.sets.length - 1];
    const clone: SetItem = prev
      ? { ...prev }
      : { weight: 0, repsMin: 8, repsMax: 10, rpe: 8, type: "Working" };
    const next = { ...exercise, sets: [...exercise.sets, clone] };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-medium truncate">{exercise.name}</div>

          {/* Muscles subtitle */}
          {Array.isArray((exercise as any).bodyParts) && (exercise as any).bodyParts.length > 0 && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Muscles: {(exercise as any).bodyParts.join(", ")}
            </div>
          )}

          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex gap-2">
          {onHistory && (
            <button
              onClick={onHistory}
              className="tap-target px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="View history"
            >
              📊
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm text-red-600 dark:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Sets table */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="grid grid-cols-[56px,1fr,1fr,1fr,1fr,1fr,72px] items-center px-3 py-2 bg-neutral-50 dark:bg-neutral-900/60 text-[11px] text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">#</span>
          <span className="font-medium">Type</span>
          <span className="font-medium">Weight (lbs)</span>
          <span className="font-medium">Reps Min</span>
          <span className="font-medium">Reps Max</span>
          <span className="font-medium">RPE</span>
          <span className="text-right font-medium">Actions</span>
        </div>

        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {exercise.sets.map((s, i) => (
            <li key={i} className="grid grid-cols-[56px,1fr,1fr,1fr,1fr,1fr,72px] items-center px-3 py-2">
              <span className="text-sm text-neutral-500">{i + 1}</span>

              {/* Set type */}
              <select
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                value={s.type}
                onChange={(e) => updateSetField(i, "type", e.target.value)}
              >
                <option>Working</option>
                <option>Warmup</option>
                <option>Drop Set</option>
              </select>

              {/* Weight */}
              <input
                inputMode="decimal"
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                value={String(s.weight)}
                onChange={(e) => updateSetField(i, "weight", e.target.value)}
              />

              {/* Reps min */}
              <input
                inputMode="numeric"
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                value={String(s.repsMin)}
                onChange={(e) => updateSetField(i, "repsMin", e.target.value)}
              />

              {/* Reps max */}
              <input
                inputMode="numeric"
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                value={String(s.repsMax)}
                onChange={(e) => updateSetField(i, "repsMax", e.target.value)}
              />

              {/* RPE */}
              <input
                inputMode="decimal"
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                value={String(s.rpe)}
                onChange={(e) => updateSetField(i, "rpe", e.target.value)}
              />

              {/* Delete */}
              <div className="flex justify-end">
                <button
                  onClick={() => deleteSet(i)}
                  className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add set button */}
      <button
        onClick={addSet}
        className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm"
      >
        + Add Set
      </button>
    </div>
  );
}