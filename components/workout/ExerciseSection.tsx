"use client";

import { useState } from "react";
import type { Exercise } from "@/components/workout/types";
import ExerciseGif from "@/components/workout/ExerciseGif";

type Props = {
  exercise: Exercise;
  onClick: () => void;
  onDelete: () => void;
};

export default function ExerciseSection({ exercise, onClick, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    setShowConfirm(false);
    onDelete();
  };

  return (
    <>
      <div className="relative w-full rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
        <button
          onClick={onClick}
          className="w-full text-left p-4 pr-12"
        >
          <div className="flex items-center gap-3">
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
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
              </div>
            </div>

            {/* Arrow indicator */}
            <svg
              className="w-5 h-5 text-neutral-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          aria-label="Delete exercise"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Exercise?</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete "{exercise.name}"? This will remove all {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"} and cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
