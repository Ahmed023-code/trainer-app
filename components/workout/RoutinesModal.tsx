"use client";

import { useEffect, useState } from "react";
import type { Exercise, Routine, SetItem, SetType } from "@/components/workout/types";
import ExerciseLibraryModal from "@/components/workout/ExerciseLibraryModal";

// ---------- Utilities ----------
const uid = () => Math.random().toString(36).slice(2);
const keepInt = (s: string) => Math.max(0, Math.floor(Number((s || "0").replace(/[^0-9]/g, ""))));

const defaultSet = (): SetItem => ({
  weight: 0,
  repsMin: 8,
  repsMax: 10,
  rpe: 8,
  type: "Working",
});

const deepCopyExercises = (arr: Exercise[]): Exercise[] =>
  arr.map((e) => ({
    name: e.name,
    sets: e.sets.map((s) => ({ ...s })),
    ...(e as any).notes !== undefined ? { notes: (e as any).notes } : {},
  }));

// ---------- Props ----------
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (r: Routine) => void;
  onPickRoutine: (r: Routine) => void;
};

// ---------- Main Modal ----------
export default function RoutinesModal({ isOpen, onClose, onSaveRoutine, onPickRoutine }: Props) {
  const [tab, setTab] = useState<"mine" | "new">("mine");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draftName, setDraftName] = useState<string>("");
  const [draftExercises, setDraftExercises] = useState<Exercise[]>([]);

  const [showLibrary, setShowLibrary] = useState(false);

  // Load routines on open. Reset draft state.
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem("workout-routines-v1");
      setRoutines(raw ? (JSON.parse(raw) as Routine[]) : []);
    } catch {
      setRoutines([]);
    }
    setTab("mine");
    setEditingId(null);
    setDraftName("");
    setDraftExercises([]);
    setShowLibrary(false);
  }, [isOpen]);

  // Persist routines while open
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem("workout-routines-v1", JSON.stringify(routines));
    } catch {
      // ignore storage errors
    }
  }, [routines, isOpen]);

  if (!isOpen) return null;

  // --------- Mutators ---------
  const saveDraft = () => {
    const base: Routine = {
      id: editingId ?? uid(),
      name: draftName.trim() || "Routine",
      exercises: deepCopyExercises(draftExercises),
    };
    setRoutines((prev) => {
      if (editingId) return prev.map((r) => (r.id === editingId ? base : r));
      return [base, ...prev];
    });
    onSaveRoutine(base);
    setEditingId(null);
    setTab("mine");
  };

  const logRoutine = (r: Routine) => {
    onPickRoutine({ id: uid(), name: r.name, exercises: deepCopyExercises(r.exercises) });
  };

  const updateExercise = (idx: number, next: Exercise) => {
    setDraftExercises((prev) => prev.map((e, i) => (i === idx ? next : e)));
  };

  const removeExercise = (idx: number) => {
    setDraftExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSetToExercise = (idx: number) => {
    setDraftExercises((prev) => {
      const next = prev.slice();
      const ex = { ...next[idx], sets: next[idx].sets.slice() };
      const prevSet = ex.sets[ex.sets.length - 1] || defaultSet();
      ex.sets.push({ ...prevSet });
      next[idx] = ex;
      return next;
    });
  };

  const removeSetFromExercise = (exIdx: number, setIdx: number) => {
    setDraftExercises((prev) => {
      const next = prev.slice();
      const ex = { ...next[exIdx], sets: next[exIdx].sets.slice() };
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
      if (ex.sets.length === 0) ex.sets.push(defaultSet());
      next[exIdx] = ex;
      return next;
    });
  };

  const updateSetField = (exIdx: number, setIdx: number, field: keyof SetItem, value: string | number) => {
    setDraftExercises((prev) => {
      const next = prev.slice();
      const ex = { ...next[exIdx], sets: next[exIdx].sets.slice() };
      const s = { ...ex.sets[setIdx] } as SetItem;

      if (field === "weight") s.weight = Number(value) || 0;
      else if (field === "repsMin") s.repsMin = Math.max(0, Math.floor(Number(value) || 0));
      else if (field === "repsMax") s.repsMax = Math.max(s.repsMin, Math.floor(Number(value) || 0));
      else if (field === "rpe") s.rpe = Math.max(0, Math.min(10, Number(value) || 0));
      else if (field === "type") s.type = String(value) as SetType;

      ex.sets[setIdx] = s;
      next[exIdx] = ex;
      return next;
    });
  };

  // ---------- Render ----------
  return (
    <div className={`fixed inset-0 ${showLibrary ? "z-[9498]" : "z-[9500]"}`}>
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute inset-0 bg-white dark:bg-neutral-900 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-[9501] p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700" onClick={onClose}>
            Back
          </button>
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 rounded-lg border ${
                tab === "mine" ? "bg-neutral-100 dark:bg-neutral-800" : "border-neutral-300 dark:border-neutral-700"
              }`}
              onClick={() => setTab("mine")}
            >
              My Routines
            </button>
            <button
              className={`px-3 py-2 rounded-lg border ${
                tab === "new" ? "bg-neutral-100 dark:bg-neutral-800" : "border-neutral-300 dark:border-neutral-700"
              }`}
              onClick={() => {
                setTab("new");
                setEditingId(null);
                setDraftName("");
                setDraftExercises([]);
              }}
            >
              New Routine
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {tab === "mine" ? (
            <ul className="space-y-2">
              {routines.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{r.exercises.length} exercises</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
                      onClick={() => {
                        setEditingId(r.id);
                        setDraftName(r.name);
                        setDraftExercises(deepCopyExercises(r.exercises));
                        setTab("new");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
                      onClick={() => logRoutine(r)}
                    >
                      Log
                    </button>
                    <button
                      className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm text-red-600 dark:text-red-400"
                      onClick={() => setRoutines((prev) => prev.filter((x) => x.id !== r.id))}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {routines.length === 0 && (
                <li className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">No routines yet.</li>
              )}
            </ul>
          ) : (
            /* tab === "new" */
            <div className="space-y-4">
              <label className="block text-sm">
                Routine name
                <input
                  className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Push Day"
                />
              </label>

              {/* Draft exercise list */}
              <ul className="space-y-3">
                {draftExercises.map((ex, exIdx) => (
                  <li key={`${ex.name}-${exIdx}`} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{ex.name}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {ex.sets.length} set{ex.sets.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
                          onClick={() => addSetToExercise(exIdx)}
                        >
                          + Set
                        </button>
                        <button
                          className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm text-red-600 dark:text-red-400"
                          onClick={() => removeExercise(exIdx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Exercise-level notes */}
                    <textarea
                      className="w-full mt-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                      rows={2}
                      placeholder="Exercise notes..."
                      value={(ex as any).notes || ""}
                      onChange={(e) => updateExercise(exIdx, { ...(ex as any), notes: e.target.value })}
                    />

                    {/* Set rows */}
                    <div className="mt-3 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                      <div className="grid grid-cols-[56px,1fr,1fr,1fr,1fr,1fr,72px] items-center px-3 py-2 bg-neutral-50 dark:bg-neutral-900/60 text-[11px] text-neutral-600 dark:text-neutral-400">
                        <span className="font-medium">#</span>
                        <span className="font-medium">Weight (lbs)</span>
                        <span className="font-medium">Reps Min</span>
                        <span className="font-medium">Reps Max</span>
                        <span className="font-medium">RPE</span>
                        <span className="font-medium">Set Type</span>
                        <span className="text-right font-medium">Actions</span>
                      </div>
                      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {ex.sets.map((s, setIdx) => (
                          <li key={setIdx} className="grid grid-cols-[56px,1fr,1fr,1fr,1fr,1fr,72px] items-center px-3 py-2">
                            <span className="text-sm text-neutral-500">{setIdx + 1}</span>

                            <input
                              inputMode="decimal"
                              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                              value={String(s.weight)}
                              onChange={(e) => updateSetField(exIdx, setIdx, "weight", Number(e.target.value) || 0)}
                            />

                            <input
                              inputMode="numeric"
                              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                              value={String(s.repsMin)}
                              onChange={(e) => updateSetField(exIdx, setIdx, "repsMin", keepInt(e.target.value))}
                            />

                            <input
                              inputMode="numeric"
                              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                              value={String(s.repsMax)}
                              onChange={(e) => updateSetField(exIdx, setIdx, "repsMax", keepInt(e.target.value))}
                            />

                            <input
                              inputMode="decimal"
                              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-1 bg-white dark:bg-neutral-900"
                              value={String(s.rpe)}
                              onChange={(e) =>
                                updateSetField(
                                  exIdx,
                                  setIdx,
                                  "rpe",
                                  Math.max(0, Math.min(10, parseFloat(e.target.value) || 0))
                                )
                              }
                            />

                            <select
                              className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              value={s.type}
                              onChange={(e) => updateSetField(exIdx, setIdx, "type", e.target.value as SetType)}
                            >
                              <option>Working</option>
                              <option>Warmup</option>
                              <option>Drop Set</option>
                            </select>

                            <div className="flex justify-end">
                              <button
                                className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm text-red-600 dark:text-red-400"
                                onClick={() => removeSetFromExercise(exIdx, setIdx)}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Add Exercise actions */}
              <div>
                <button
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
                  onClick={() => setShowLibrary(true)}
                >
                  + Add Exercise
                </button>

                {/* ExerciseLibraryModal overlay for adding exercises */}
                <ExerciseLibraryModal
                  isOpen={showLibrary}
                  onClose={() => setShowLibrary(false)}
                  onPick={(ex) => {
                    const exists = draftExercises.some(
                      (e) => e.name.toLowerCase() === ex.name.toLowerCase()
                    );
                    if (!exists) {
                      setDraftExercises((prev) => [
                        ...prev,
                        { name: ex.name, sets: [], notes: "" as any },
                      ]);
                    }
                    setShowLibrary(false);
                  }}
                />
              </div>

              {/* Save */}
              <div className="pt-2 flex justify-end">
                <button
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
                  onClick={saveDraft}
                >
                  Save Routine
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}