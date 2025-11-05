"use client";

import { useEffect, useState, useRef } from "react";
import type { Exercise, Routine, SetItem, SetType } from "@/components/workout/types";
import ExerciseLibraryModal from "@/components/workout/ExerciseLibraryModal";
import ExerciseGif from "@/components/workout/ExerciseGif";

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

const deepCopyExercises = (arr: Exercise[], routineId?: string): Exercise[] =>
  arr.map((e) => ({
    name: e.name,
    sets: e.sets.map((s) => ({ ...s, repsPerformed: undefined })), // Reset repsPerformed for new workout
    ...(e as any).notes !== undefined ? { notes: (e as any).notes } : {},
    source: "routine" as const, // Mark as routine exercise
    routineId, // Track which routine this came from
    // Preserve visual and metadata fields
    ...((e as any).gifUrl ? { gifUrl: (e as any).gifUrl } : {}),
    ...((e as any).targetMuscles ? { targetMuscles: (e as any).targetMuscles } : {}),
    ...((e as any).secondaryMuscles ? { secondaryMuscles: (e as any).secondaryMuscles } : {}),
    ...((e as any).exerciseId ? { exerciseId: (e as any).exerciseId } : {}),
    ...((e as any).bodyParts ? { bodyParts: (e as any).bodyParts } : {}),
  }));

// Helper to get set color based on type
const getSetColor = (type: SetType): string => {
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

// ---------- Props ----------
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (r: Routine) => void;
  onPickRoutine: (r: Routine) => void;
  onSwitchToQuickAdd?: () => void;
};

// ---------- Main Modal ----------
export default function RoutinesModal({ isOpen, onClose, onSaveRoutine, onPickRoutine, onSwitchToQuickAdd }: Props) {
  const [tab, setTab] = useState<"mine" | "new">("mine");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draftName, setDraftName] = useState<string>("");
  const [draftEmoji, setDraftEmoji] = useState<string>("");
  const [draftExercises, setDraftExercises] = useState<Exercise[]>([]);

  const [showLibrary, setShowLibrary] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs for menu trigger buttons
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const setMenuBtnRef = (id: string) => (el: HTMLButtonElement | null) => {
    menuBtnRefs.current[id] = el;
  };

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
    setDraftEmoji("");
    setDraftExercises([]);
    setShowLibrary(false);
    setMenuOpenId(null);
    setShowEmojiPicker(false);
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
    // Auto-generate name if empty
    let finalName = draftName.trim();
    if (!finalName) {
      const count = routines.length + 1;
      finalName = `Routine ${count}`;
    }

    const base: Routine = {
      id: editingId ?? uid(),
      name: finalName,
      exercises: deepCopyExercises(draftExercises),
      emoji: draftEmoji || undefined,
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
    onPickRoutine({ id: uid(), name: r.name, exercises: deepCopyExercises(r.exercises, r.id), emoji: r.emoji });
    onClose();
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

  const handleNewRoutine = () => {
    setTab("new");
    setEditingId(null);
    // Auto-generate name
    const count = routines.length + 1;
    setDraftName(`Routine ${count}`);
    setDraftEmoji("💪"); // Default emoji
    setDraftExercises([]);
  };

  // Function to open routine menu with position calculation
  const openRoutineMenu = (id: string) => {
    const r = menuBtnRefs.current[id]?.getBoundingClientRect();
    if (!r) return;

    const menuWidth = 160;
    const menuHeight = 130; // approximate for 3 buttons
    const spacing = 8;

    // Position below and to the right of button
    let top = r.bottom + spacing;
    let left = r.right - menuWidth;

    // Keep on screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < spacing) left = spacing;
    if (left + menuWidth > viewportWidth - spacing) left = viewportWidth - menuWidth - spacing;
    if (top + menuHeight > viewportHeight - spacing) top = r.top - menuHeight - spacing;
    if (top < spacing) top = spacing;

    setMenuPos({ top, left });
    setMenuOpenId(id);
  };

  // Scroll and escape handler for routine menu
  useEffect(() => {
    if (!menuOpenId) return;

    const handleScroll = () => {
      setMenuOpenId(null);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpenId(null);
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpenId]);

  // ---------- Render ----------
  return (
    <div className="fixed inset-0 z-[9500]">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute inset-0 bg-white dark:bg-neutral-900 flex flex-col">
        {/* Tab Switcher - only show if onSwitchToQuickAdd is provided */}
        {onSwitchToQuickAdd && (
          <div className="sticky top-0 z-[9502] bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Back
              </button>
              <div className="flex flex-1 gap-1">
                <button
                  onClick={onSwitchToQuickAdd}
                  className="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                >
                  Quick Add
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-[var(--accent-workout)] text-black"
                >
                  Routines
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header - only show when NOT in workout log mode */}
        {!onSwitchToQuickAdd && (
          <div className="sticky top-0 z-10 p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            <button className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700" onClick={onClose}>
              Back
            </button>
            <div className="flex gap-2">
              <button
                className={`px-3 py-2 rounded-full border border-[#FACC15] ${
                  tab === "mine"
                    ? "bg-neutral-100 dark:bg-neutral-800 text-[#FACC15]"
                    : "text-[#FACC15] hover:bg-[#FACC15]/10"
                }`}
                onClick={() => setTab("mine")}
              >
                My Routines
              </button>
              <button
                className="px-3 py-2 rounded-full bg-[#FACC15] text-black font-medium hover:bg-[#EAB308] transition-colors"
                onClick={handleNewRoutine}
              >
                + New
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-24">
          {tab === "mine" ? (
            <>
              <ul className="space-y-2">
              {routines.map((r) => (
                <li
                  key={r.id}
                  className="rounded-full border border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between relative"
                >
                  {/* Clickable routine name area with emoji */}
                  <button
                    onClick={() => logRoutine(r)}
                    className="flex-1 text-left min-w-0 flex items-center gap-2"
                  >
                    {r.emoji && <span className="text-2xl flex-shrink-0">{r.emoji}</span>}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{r.exercises.length} exercises</div>
                    </div>
                  </button>

                  {/* Three-dot menu button */}
                  <div className="relative">
                    <button
                      ref={setMenuBtnRef(r.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (menuOpenId === r.id) {
                          setMenuOpenId(null);
                        } else {
                          openRoutineMenu(r.id);
                        }
                      }}
                      aria-label="Options"
                    >
                      <span className="text-lg font-bold">⋮</span>
                    </button>

                    {/* Rectangular menu with pill buttons positioned near button */}
                    {menuOpenId === r.id && typeof document !== "undefined" && createPortal(
                      <>
                        {/* Backdrop to close menu */}
                        <button
                          className="fixed inset-0 z-[9998]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(null);
                          }}
                          aria-label="Close menu"
                        />
                        {/* Menu positioned near trigger button */}
                        <div
                          className="fixed z-[9999] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-3 min-w-[160px] space-y-2"
                          style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                          onClick={(e) => e.stopPropagation()}
                        >
                            <button
                              className="w-full px-4 py-2 rounded-full text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(r.id);
                                setDraftName(r.name);
                                setDraftEmoji(r.emoji || "💪");
                                setDraftExercises(deepCopyExercises(r.exercises));
                                setTab("new");
                                setMenuOpenId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="w-full px-4 py-2 rounded-full text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                logRoutine(r);
                                setMenuOpenId(null);
                              }}
                            >
                              Log
                            </button>
                            <button
                              className="w-full px-4 py-2 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoutines((prev) => prev.filter((x) => x.id !== r.id));
                                setMenuOpenId(null);
                              }}
                            >
                              Delete
                            </button>
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </li>
              ))}
              {routines.length === 0 && (
                <li className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">No routines yet.</li>
              )}
            </ul>

              {/* "+ New Routine" button at bottom - styled like "+ Log Workout" */}
              <div className="flex items-center justify-center pt-4">
                <button
                  onClick={handleNewRoutine}
                  className="px-8 py-3 rounded-full text-base font-medium border-2 bg-transparent transition-all hover:bg-opacity-5"
                  style={{ borderColor: "var(--accent-workout)", color: "var(--accent-workout)", backgroundColor: "transparent" }}
                >
                  + New Routine
                </button>
              </div>
            </>
          ) : tab === "new" ? (
            /* tab === "new" */
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <label className="block text-sm mb-1">Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-16 h-16 rounded-full border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-3xl flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {draftEmoji || "💪"}
                  </button>
                </div>
                <label className="block text-sm flex-1">
                  Routine name
                  <input
                    className="mt-1 w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Routine name"
                  />
                </label>
              </div>

              {/* Simple emoji picker */}
              {showEmojiPicker && (
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="grid grid-cols-8 gap-2">
                    {["💪", "🏋️", "🔥", "⚡", "🎯", "🚀", "💯", "⭐", "🏆", "👊", "💥", "🦾", "🎪", "🎨", "🎵", "🎮"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setDraftEmoji(emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-2xl flex items-center justify-center transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft exercise list */}
              <ul className="space-y-3">
                {draftExercises.map((ex, exIdx) => (
                  <li key={`${ex.name}-${exIdx}`} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Circular GIF Preview */}
                      {(ex as any).gifUrl && (
                        <div className="flex-shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-sm">
                          <ExerciseGif
                            gifUrl={(ex as any).gifUrl}
                            alt={ex.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{ex.name}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {ex.sets.length} set{ex.sets.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      <button
                        className="px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex-shrink-0"
                        onClick={() => removeExercise(exIdx)}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Exercise-level notes */}
                    <textarea
                      className="w-full mt-2 rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 resize-none"
                      rows={2}
                      placeholder="Exercise notes..."
                      value={(ex as any).notes || ""}
                      onChange={(e) => updateExercise(exIdx, { ...(ex as any), notes: e.target.value })}
                    />

                    {/* Column headers - centered */}
                    {ex.sets.length > 0 && (
                      <div className="grid grid-cols-[24px,80px,60px,1fr,48px,36px] gap-1 px-1 mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        <div className="text-center">#</div>
                        <div className="text-center">Type</div>
                        <div className="text-center">lbs</div>
                        <div className="text-center">Reps</div>
                        <div className="text-center">RPE</div>
                        <div></div>
                      </div>
                    )}

                    {/* Set rows - with color coding based on type */}
                    <div className="mt-2 space-y-2">
                      {ex.sets.map((s, setIdx) => (
                        <div
                          key={setIdx}
                          className={`grid grid-cols-[24px,80px,60px,1fr,48px,36px] gap-1 items-center rounded-full border px-1 py-1.5 ${getSetColor(s.type)}`}
                        >
                          {/* Set number */}
                          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 text-center">
                            {setIdx + 1}
                          </span>

                          {/* Type select */}
                          <select
                            className="text-[11px] rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 min-w-0"
                            value={s.type}
                            onChange={(e) => updateSetField(exIdx, setIdx, "type", e.target.value as SetType)}
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
                            onChange={(e) => updateSetField(exIdx, setIdx, "weight", Number(e.target.value) || 0)}
                            placeholder="0"
                          />

                          {/* Reps range input (combined min-max) */}
                          <div className="flex items-center gap-0.5 min-w-0">
                            <input
                              inputMode="numeric"
                              className="w-full text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-1 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                              value={String(s.repsMin)}
                              onChange={(e) => updateSetField(exIdx, setIdx, "repsMin", keepInt(e.target.value))}
                              placeholder="8"
                            />
                            <span className="text-xs text-neutral-400">-</span>
                            <input
                              inputMode="numeric"
                              className="w-full text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-1 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                              value={String(s.repsMax)}
                              onChange={(e) => updateSetField(exIdx, setIdx, "repsMax", keepInt(e.target.value))}
                              placeholder="10"
                            />
                          </div>

                          {/* RPE input */}
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            inputMode="decimal"
                            className="text-sm text-center rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 bg-white dark:bg-neutral-900 min-w-0"
                            value={s.rpe === 0 ? "" : String(s.rpe)}
                            onChange={(e) =>
                              updateSetField(
                                exIdx,
                                setIdx,
                                "rpe",
                                Math.max(0, Math.min(10, parseFloat(e.target.value) || 0))
                              )
                            }
                            placeholder="8"
                          />

                          {/* Delete button */}
                          <button
                            onClick={() => removeSetFromExercise(exIdx, setIdx)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-600 dark:bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700"
                            aria-label="Delete set"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* + Set button positioned below last set */}
                      <button
                        className="w-full px-3 py-2 rounded-full bg-[#FACC15] text-black text-sm font-medium hover:bg-[#EAB308] transition-colors"
                        onClick={() => addSetToExercise(exIdx)}
                      >
                        + Set
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Add Exercise button */}
              <button
                className="px-4 py-2 rounded-full bg-[#FACC15] text-black font-medium hover:bg-[#EAB308] transition-colors"
                onClick={() => setShowLibrary(true)}
              >
                + Add Exercise
              </button>
            </div>
          ) : null}
        </div>

        {/* FAB for + New when in workout log mode */}
        {onSwitchToQuickAdd && tab === "mine" && (
          <button
            onClick={handleNewRoutine}
            className="fixed right-6 bottom-24 z-[9600] w-14 h-14 rounded-full bg-[#FACC15] text-black shadow-lg flex items-center justify-center hover:bg-[#EAB308] transition-colors"
            aria-label="New routine"
          >
            <span className="text-3xl leading-none" style={{ marginTop: '-2px' }}>+</span>
          </button>
        )}

        {/* Fixed footer for new routine tab */}
        {tab === "new" && (
          <div className="sticky bottom-0 z-10 p-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
            <button
              onClick={() => setTab("mine")}
              className="flex-1 px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveDraft}
              className="flex-1 px-4 py-3 rounded-full bg-[#FACC15] text-black font-medium hover:bg-[#EAB308] transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* ExerciseLibraryModal overlay for adding exercises - render outside main modal */}
      {showLibrary && (
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
                {
                  name: ex.name,
                  sets: [defaultSet()],
                  notes: "" as any,
                  ...((ex as any).targetMuscles ? { targetMuscles: (ex as any).targetMuscles } : {}),
                  ...((ex as any).secondaryMuscles ? { secondaryMuscles: (ex as any).secondaryMuscles } : {}),
                  ...((ex as any).bodyParts ? { bodyParts: (ex as any).bodyParts } : {}),
                  ...((ex as any).gifUrl ? { gifUrl: (ex as any).gifUrl } : {}),
                  ...((ex as any).exerciseId ? { exerciseId: (ex as any).exerciseId } : {}),
                } as any,
              ]);
            }
            setShowLibrary(false);
          }}
        />
      )}
    </div>
  );
}
