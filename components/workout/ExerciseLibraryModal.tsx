"use client";

import { useEffect, useMemo, useState } from "react";
import type { Exercise, SetItem } from "@/components/workout/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
};

type Row = {
  name: string;
  bodyParts?: string[]; // new dataset uses array
  bodyPart?: string;    // legacy single string
  equipment?: string;
  category?: string;    // strength, cardio, mobility
};

const norm = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

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

export default function ExerciseLibraryModal({ isOpen, onClose, onPick }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [category, setCategory] = useState<"strength" | "cardio" | "mobility">("strength");

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
        const res = await fetch("/data/exercises.json");
        const json = await res.json();
        const arr: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.exercises)
          ? json.exercises
          : [];
        const rows: Row[] = arr
          .map((r) => ({
            name: String(r?.name ?? "").trim(),
            bodyParts: Array.isArray(r?.bodyParts)
              ? r.bodyParts.map((x: any) => String(x))
              : undefined,
            bodyPart: r?.bodyPart ? String(r.bodyPart) : undefined,
            equipment: r?.equipment ? String(r.equipment) : undefined,
            category: r?.category ? String(r.category) : "strength",
          }))
          .filter((r) => r.name.length > 0);
        setData(rows);
        setLoaded(true);
      } catch {
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
    if (!query) return list.slice(0, 50);

    const aliasTerms = new Set<string>((bodyAliases[query] || []).map(norm).filter(Boolean));

    const scoreOf = (r: Row) => {
      const name = norm(r.name);
      const bodyArr = Array.isArray(r.bodyParts) ? r.bodyParts : (r.bodyPart ? [r.bodyPart] : []);
      const body = norm(bodyArr.join(" "));
      const equip = norm(r.equipment || "");

      let s = 0;
      if (name === query) s += 5;
      if (name.startsWith(query)) s += 3;
      if (name.split(" ").some((w) => w.startsWith(query))) s += 2;
      if (name.includes(query)) s += 1;

      // body/equipment
      if (body.includes(query)) s += 1;
      if (equip.includes(query)) s += 1;

      // alias boost for legs → quads/glutes/hamstrings, etc.
      if (aliasTerms.size > 0) {
        const bodyTokens = new Set(body.split(" "));
        for (const t of aliasTerms) {
          if (bodyTokens.has(t)) s += 2;
        }
      }

      return s;
    };

    return list
      .map((r) => ({ r, s: scoreOf(r) }))
      .filter((x) => x.s >= 2)
      .sort((a, b) => (b.s - a.s) || a.r.name.localeCompare(b.r.name))
      .map((x) => x.r);
  }, [data, qDeb, category]);

  if (!isOpen) return null;

  const startCustomFlow = (name: string) => {
    setCustomName(name);
    setSelectedMuscles(Object.fromEntries(MUSCLES.map((m) => [m, false])) as Record<string, boolean>);
    setShowCustomMuscles(true);
  };

  const confirmCustom = () => {
    const picked = MUSCLES.filter((m) => selectedMuscles[m]);
    const ex: Exercise = {
      name: customName,
      sets: [defaultSetTemplate()],
      notes: "",
      // Store muscles for grouping on the page. The page reads (ex as any).bodyParts.
      ...(picked.length ? { bodyParts: picked as any } : {}),
    } as any;
    onPick(ex);
    setShowCustomMuscles(false);
    setCustomName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9500]">
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
        {/* Header */}
        <div className="sticky top-0 z-[9501] p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
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
          <input
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
            const parts = r.bodyParts && r.bodyParts.length
              ? r.bodyParts.join(", ")
              : r.bodyPart || undefined;
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
                      ...(Array.isArray(r.bodyParts) && r.bodyParts.length ? { bodyParts: r.bodyParts as any } : {}),
                    } as any;
                    onPick(ex);
                    onClose();
                  }}
                >
                  <div className="font-medium">{r.name}</div>
                  {(parts || r.equipment) && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {[parts, r.equipment].filter(Boolean).join(" • ")}
                    </div>
                  )}
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