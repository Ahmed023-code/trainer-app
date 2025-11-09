"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Fuse from "fuse.js";
import type { Exercise, SetItem } from "@/components/workout/types";
import { getOfflineDB, type ExerciseDBExercise } from "@/utils/offlineDb";
import ExerciseGif from "@/components/workout/ExerciseGif";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
  onSwitchToRoutines?: () => void;
};

type Row = {
  exerciseId?: string;
  name: string;
  bodyParts?: string[];
  equipment?: string;
  category?: string;    // strength, cardio, mobility
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  gifUrl?: string;
};

const norm = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase() // Convert to uppercase for matching
    .replace(/\s+/g, " ")
    .trim();

const toTitleCase = (s: string) =>
  String(s || "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const defaultSetTemplate = (): SetItem => ({
  weight: 0,
  repsMin: 8,
  repsMax: 10,
  rpe: 8,
  type: "Working",
});

const MUSCLES = [
  "Quads",
  "Glutes",
  "Hamstrings",
  "Calves",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
] as const;

export default function ExerciseLibraryModal({ isOpen, onClose, onPick, onSwitchToRoutines }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [category, setCategory] = useState<"strength" | "cardio" | "mobility">("strength");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [fuseInstance, setFuseInstance] = useState<Fuse<Row> | null>(null);

  // custom-exercise muscle selection
  const [showCustomMuscles, setShowCustomMuscles] = useState(false);
  const [customName, setCustomName] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(MUSCLES.map((m) => [m, false])) as Record<string, boolean>
  );

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setQDeb(norm(q)), 200);
    return () => clearTimeout(t);
  }, [q]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && !showCustomMuscles && searchInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showCustomMuscles]);

  // load once per open
  useEffect(() => {
    if (!isOpen) {
      // reset on close
      setQ("");
      setQDeb("");
      setShowCustomMuscles(false);
      setCustomName("");
      setSelectedMuscles(Object.fromEntries(MUSCLES.map((m) => [m, false])) as Record<string, boolean>);
      return;
    }
    if (loaded) return;
    (async () => {
      try {
        const db = await getOfflineDB();
        const exercises = await db.getAllExercises();

        // Convert ExerciseDB format to Row format
        const exerciseDBRows: Row[] = exercises.map((ex: ExerciseDBExercise) => ({
          exerciseId: ex.exerciseId,
          name: toTitleCase(ex.name), // Display names in title case
          bodyParts: ex.bodyParts,
          equipment: ex.equipments?.[0] ? toTitleCase(ex.equipments[0]) : undefined, // Title Case equipment
          category: "strength", // ExerciseDB exercises are strength by default
          targetMuscles: ex.targetMuscles,
          secondaryMuscles: ex.secondaryMuscles,
          gifUrl: ex.gifUrl,
        }));

        setData(exerciseDBRows);

        // Initialize Fuse.js for fuzzy search
        const fuseOptions = {
          shouldSort: true,
          includeScore: true,
          threshold: 0.4, // allows small spelling errors but still relevant
          distance: 100,
          keys: [
            { name: 'name', weight: 0.7 },
            { name: 'targetMuscles', weight: 0.2 },
            { name: 'secondaryMuscles', weight: 0.1 },
            { name: 'equipment', weight: 0.1 }
          ]
        };

        const fuse = new Fuse(exerciseDBRows, fuseOptions);
        setFuseInstance(fuse);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to load exercises:", error);
        setData([]);
        setLoaded(true);
      }
    })();
  }, [isOpen, loaded]);

  // body-part aliases to improve matching
  const bodyAliases: Record<string, string[]> = {
    legs: ["quads", "glutes", "hamstrings"],
    leg: ["quads", "glutes", "hamstrings"],
    quad: ["quads"],
    quads: ["quads"],
    ham: ["hamstrings"],
    hamstring: ["hamstrings"],
    hamstrings: ["hamstrings"],
    glute: ["glutes"],
    glutes: ["glutes"],
    core: ["core", "abs", "obliques"],
    abs: ["core", "abs"],
    oblique: ["core", "obliques"],
    obliques: ["core", "obliques"],
  };

  const results = useMemo(() => {
    const list = data.filter(r => r.category === category);
    const query = qDeb;

    // If no query, return first 50 results
    if (!query) return list.slice(0, 50);

    // If Fuse instance not ready, fall back to showing all
    if (!fuseInstance) return list.slice(0, 50);

    // Use Fuse.js for fuzzy search
    const fuseResults = fuseInstance.search(query);

    // Filter by category and limit to top 50 results
    const filteredResults = fuseResults
      .map(result => result.item)
      .filter(item => item.category === category)
      .slice(0, 50);

    return filteredResults;
  }, [data, qDeb, category, fuseInstance]);

  if (!isOpen) return null;

  const startCustomFlow = (name: string) => {
    setCustomName(name);
    setSelectedMuscles(Object.fromEntries(MUSCLES.map((m) => [m, false])) as Record<string, boolean>);
    setShowCustomMuscles(true);
  };

  const confirmCustom = async () => {
    const picked = MUSCLES.filter((m) => selectedMuscles[m]);

    // Generate a unique ID for the custom exercise
    const customExerciseId = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Save to IndexedDB for future searches
    try {
      const db = await getOfflineDB();
      const customExercise: ExerciseDBExercise = {
        exerciseId: customExerciseId,
        name: customName,
        gifUrl: '', // No GIF for custom exercises
        targetMuscles: picked.map(m => m.toLowerCase()),
        bodyParts: picked.map(m => m.toLowerCase()),
        equipments: [],
        secondaryMuscles: [],
        instructions: [],
      };
      await db.saveCustomExercise(customExercise);

      // Reload exercises to include the new custom exercise
      const allExercises = await db.getAllExercises();
      const exerciseDBRows: Row[] = allExercises.map((ex: ExerciseDBExercise) => ({
        exerciseId: ex.exerciseId,
        name: toTitleCase(ex.name),
        bodyParts: ex.bodyParts,
        equipment: ex.equipments?.[0] ? toTitleCase(ex.equipments[0]) : undefined,
        category: "strength",
        targetMuscles: ex.targetMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        gifUrl: ex.gifUrl,
      }));
      setData(exerciseDBRows);

      // Rebuild Fuse instance with updated data
      const fuseOptions = {
        shouldSort: true,
        includeScore: true,
        threshold: 0.4,
        distance: 100,
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'targetMuscles', weight: 0.2 },
          { name: 'secondaryMuscles', weight: 0.1 },
          { name: 'equipment', weight: 0.1 }
        ]
      };
      const fuse = new Fuse(exerciseDBRows, fuseOptions);
      setFuseInstance(fuse);
    } catch (error) {
      console.error('Failed to save custom exercise:', error);
    }

    const ex: Exercise = {
      name: customName,
      sets: [defaultSetTemplate()],
      notes: "",
      exerciseId: customExerciseId,
      // Store muscles for grouping on the page. The page reads (ex as any).bodyParts.
      ...(picked.length ? { bodyParts: picked as any, targetMuscles: picked.map(m => m.toLowerCase()) } : {}),
    } as any;
    onPick(ex);
    setShowCustomMuscles(false);
    setCustomName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* backdrop closes entire sheet */}
      <button
        className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => {
          setShowCustomMuscles(false);
          setCustomName("");
          onClose();
        }}
      />
      <div className="absolute inset-0 bg-white dark:bg-neutral-900 flex flex-col">
        {/* Tab Switcher - only show if onSwitchToRoutines is provided */}
        {onSwitchToRoutines && (
          <div className="sticky top-0 z-[9502] bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <button
                onClick={() => {
                  setShowCustomMuscles(false);
                  setCustomName("");
                  onClose();
                }}
                className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Back
              </button>
              <div className="flex flex-1 gap-1">
                <button
                  className="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-[var(--accent-workout)] text-black"
                >
                  Quick Add
                </button>
                <button
                  onClick={onSwitchToRoutines}
                  className="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                >
                  Routines
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header - Back button only shown when NOT in workout log mode */}
        <div className="sticky top-0 z-[9501] p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          {!onSwitchToRoutines && (
            <button
              className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
              onClick={() => {
                setShowCustomMuscles(false);
                setCustomName("");
                onClose();
              }}
            >
              Back
            </button>
          )}
          <input
            ref={searchInputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises or body parts (e.g., chest, quads, barbell)"
            className="flex-1 rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
          />
        </div>

        {/* Category Tabs */}
        <div className="sticky top-[60px] z-[9500] px-3 pt-3 pb-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex gap-2">
          <button
            className={`px-4 py-2 rounded-full border transition-colors ${
              category === "strength"
                ? "bg-[#FACC15] border-[#FACC15] text-black font-medium"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            onClick={() => setCategory("strength")}
          >
            Strength
          </button>
          <button
            className={`px-4 py-2 rounded-full border transition-colors ${
              category === "cardio"
                ? "bg-[#FACC15] border-[#FACC15] text-black font-medium"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            onClick={() => setCategory("cardio")}
          >
            Cardio
          </button>
          <button
            className={`px-4 py-2 rounded-full border transition-colors ${
              category === "mobility"
                ? "bg-[#FACC15] border-[#FACC15] text-black font-medium"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            onClick={() => setCategory("mobility")}
          >
            Mobility
          </button>
        </div>

        {/* Results */}
        <ul className="p-3 space-y-2 overflow-y-auto">
          {/* Always offer custom add when query is non-empty */}
          {q.trim() && (
            <li className="rounded-full border border-neutral-200 dark:border-neutral-800 p-3">
              <button
                className="w-full text-left"
                onClick={() => startCustomFlow(q.trim())}
              >
                <div className="font-medium">Add custom exercise “{q.trim()}”</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Not in the library? Tap to add it and choose muscles.
                </div>
              </button>
            </li>
          )}

          {results.map((r, i) => {
            const targetMuscles = r.targetMuscles && r.targetMuscles.length
              ? r.targetMuscles.map((m: string) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")
              : undefined;
            return (
              <li
                key={`${r.name}-${i}`}
                className="rounded-full border border-neutral-200 dark:border-neutral-800 p-3"
              >
                <button
                  className="w-full text-left"
                  onClick={() => {
                    const ex: Exercise = {
                      name: r.name,
                      sets: [defaultSetTemplate()],
                      notes: "",
                      ...(r.targetMuscles ? { targetMuscles: r.targetMuscles } : {}),
                      ...(r.secondaryMuscles ? { secondaryMuscles: r.secondaryMuscles } : {}),
                      ...(Array.isArray(r.bodyParts) && r.bodyParts.length ? { bodyParts: r.bodyParts as any } : {}),
                      ...(r.gifUrl ? { gifUrl: r.gifUrl } : {}),
                      ...(r.exerciseId ? { exerciseId: r.exerciseId } : {}),
                    } as any;
                    onPick(ex);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Circular GIF Preview */}
                    {r.gifUrl && (
                      <div className="flex-shrink-0 w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <ExerciseGif
                          gifUrl={r.gifUrl}
                          alt={r.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{r.name}</div>
                      {(targetMuscles || r.equipment) && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {[targetMuscles, r.equipment].filter(Boolean).join(" • ")}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}

          {results.length === 0 && !qDeb && (
            <li className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
              Start typing to search.
            </li>
          )}
        </ul>
      </div>

      {/* Custom muscles chooser modal */}
      {showCustomMuscles && (
        <div className="fixed inset-0 z-[9550]">
          <button
            className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setShowCustomMuscles(false)}
          />
          <div className="absolute right-6 bottom-28 w-[min(92vw,420px)] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-4">
            <div className="text-lg font-medium">Muscles worked</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Select all that apply for “{customName}”
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {MUSCLES.map((m) => {
                const checked = !!selectedMuscles[m];
                return (
                  <label
                    key={m}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 cursor-pointer ${
                      checked
                        ? "border-blue-400 bg-blue-50 dark:bg-neutral-800"
                        : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-500"
                      checked={checked}
                      onChange={(e) =>
                        setSelectedMuscles((prev) => ({ ...prev, [m]: e.target.checked }))
                      }
                    />
                    <span className="text-sm">{m}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
                onClick={() => setShowCustomMuscles(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded-full bg-[#FACC15] text-black"
                onClick={confirmCustom}
              >
                Add Exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}