"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Props contract stays the same
export default function FoodLibraryModal({
  isOpen,
  onClose,
  onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPick: (item: {
    name: string;
    quantity: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }) => void;
}) {
  // ---------- helpers ----------
  const safeNum = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "string" && v.trim() === "") return 0;
    const s = String(v).replace(/,/g, ""); // strip thousands separators
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  // Expanded and more permissive household words detector
  const hasHouseholdWords = (label: string) =>
    /\b(cup|cups?|tbsp|tbsps?|tablespoon|tablespoons?|tsp|tsps?|teaspoon|teaspoons?|oz|oz\.|ounce|ounces|fl\s?oz|pint|pints|quart|quarts|ml|milliliter|milliliters|l|liter|liters|slice|slices|piece|pieces|egg|eggs|stick|sticks|can|cans|pkg|package|packages|bottle|bottles)\b/i.test(
      label || ""
    );

  const isPureGramLabel = (label: string) => /^\s*\d+(\.\d+)?\s*g\s*$/i.test(label || "");

  // robust macro reader: accepts multiple key aliases and optional nested macros object
  const readMacro = (f: any, keys: string[]): number => {
    for (const k of keys) {
      const direct = f?.[k];
      if (direct !== undefined && direct !== null && String(direct) !== "") {
        return safeNum(direct);
      }
    }
    if (f?.macros && typeof f.macros === "object") {
      for (const k of keys) {
        const nested = f.macros[k];
        if (nested !== undefined && nested !== null && String(nested) !== "") {
          return safeNum(nested);
        }
      }
    }
    return 0;
  };

  // ---------- data state ----------
  const [loaded, setLoaded] = useState(false);
  const [foods, setFoods] = useState<any[]>([]); // shape provided by /data/foods.json

  // load once on first open
  useEffect(() => {
    if (!isOpen || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/data/foods.json", { cache: "force-cache" });
        const json = await res.json();
        const arr = Array.isArray(json) ? json : Array.isArray(json?.foods) ? json.foods : [];
        if (!cancelled) {
          setFoods(arr);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setFoods([]);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, loaded]);

  // ---------- search state ----------
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  // reset all on close
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebounced("");
      setActiveIdx(null);
      setMode("servings");
      setSelPortionIdx(0);
      setServings("1");
      setGrams("100");
      setUnits("1");
      setShowQuickAdd(false);
      setQuickAddForm({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        quantity: "1",
      });
    }
  }, [isOpen]);

  // ---------- per-row quantity bubble state ----------
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<"servings" | "weight" | "volume">("servings");
  const [selPortionIdx, setSelPortionIdx] = useState(0);
  const [servings, setServings] = useState("1");
  const [grams, setGrams] = useState("100");
  const [units, setUnits] = useState("1");

  // ---------- quick add state ----------
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    quantity: "1",
  });

  // build portions array for a food row with resilient fallbacks
  const buildPortions = (f: any): { label: string; grams: number }[] => {
    const list: { label: string; grams: number }[] = Array.isArray(f?.portions)
      ? f.portions
          .map((p: any) => ({
            label: String(p?.label ?? "").trim(),
            grams: safeNum(p?.grams),
          }))
          .filter((p: any) => p.grams > 0 && p.label)
      : [];

    if (list.length > 0) return list;

    const g = safeNum(f?.servingGrams) || 100;
    const label = String(f?.servingLabel || `${g} g`);
    return [{ label, grams: g }];
  };

  // derive per-100g macros for a food row from its per-serving values (or explicit per100 if present)
  const per100gFor = (f: any) => {
    // Prefer explicit per100g record if present and non-zero
    const per100 =
      f?.per100g && typeof f.per100g === "object"
        ? {
            cal: safeNum(f.per100g.calories),
            p:   safeNum(f.per100g.protein),
            fat: safeNum(f.per100g.fat),
            c:   safeNum(f.per100g.carbs),
          }
        : null;

    // Expanded calorie key aliases
    const baseFromServing = {
      cal: readMacro(f, ["calories", "Calories", "kcal", "kcals", "cal", "energy", "Energy", "energyKcal", "energy_kcal"]),
      p:   readMacro(f, ["protein", "prot", "protein_g"]),
      fat: readMacro(f, ["fat", "fat_g"]),
      c:   readMacro(f, ["carbs", "carbohydrate", "carbohydrates", "carb", "carbohydrate_g"]),
    };

    const atwaterCal = (p: number, fat: number, c: number) => 4 * p + 9 * fat + 4 * c;
    const allZero = (o: any) => !o || (o.cal === 0 && o.p === 0 && o.fat === 0 && o.c === 0);

    if (!allZero(per100)) return per100 as { cal: number; p: number; fat: number; c: number };

    // Derive per-100g from per-serving when needed
    const sg = safeNum(f?.servingGrams) || 100;
    const scale = sg > 0 ? 100 / sg : 1;

    const derived = {
      cal: baseFromServing.cal * scale,
      p:   baseFromServing.p   * scale,
      fat: baseFromServing.fat * scale,
      c:   baseFromServing.c   * scale,
    };

    let fixed = { ...derived };
    if (fixed.cal === 0 && (fixed.p > 0 || fixed.fat > 0 || fixed.c > 0)) {
      fixed.cal = atwaterCal(fixed.p, fixed.fat, fixed.c);
    }

    // Final fallback: if still zero, try reading alternative numeric container `perServing`
    if (fixed.cal === 0 && fixed.p === 0 && fixed.fat === 0 && fixed.c === 0) {
      const ps = f?.perServing && typeof f.perServing === "object" ? f.perServing : null;
      if (ps) {
        const tmp = {
          cal: safeNum(ps.calories),
          p:   safeNum(ps.protein),
          fat: safeNum(ps.fat),
          c:   safeNum(ps.carbs),
        };
        const sg2 = safeNum(f?.servingGrams) || 100;
        const scale2 = sg2 > 0 ? 100 / sg2 : 1;
        fixed = {
          cal: tmp.cal * scale2,
          p:   tmp.p   * scale2,
          fat: tmp.fat * scale2,
          c:   tmp.c   * scale2,
        };
        if (fixed.cal === 0 && (fixed.p > 0 || fixed.fat > 0 || fixed.c > 0)) {
          fixed.cal = atwaterCal(fixed.p, fixed.fat, fixed.c);
        }
      }
    }

    return fixed;
  };

  // filter results realtime
  const results = useMemo(() => {
    if (!debounced) return foods.slice(0, 50);
    const q = debounced;
    const starts = (s: string) => s.startsWith(q);
    const includes = (s: string) => s.includes(q);

    const scored = foods.map((f) => {
      const name = String(f?.description || "").toLowerCase();
      const cat = String(f?.category || "").toLowerCase();
      let score = 0;
      if (starts(name)) score += 3;
      if (name.split(/\s+/).some((w) => starts(w))) score += 2;
      if (includes(name)) score += 1;
      if (includes(cat)) score += 1;
      return { f, score, name };
    });

    return scored
      .filter((x) => x.score >= 1)
      .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name))
      .slice(0, 100)
      .map((x) => x.f);
  }, [foods, debounced]);

  // ---------- chips UI ----------
  const ChipRow = ({ f }: { f: any }) => {
    const primary = buildPortions(f)[0];
    const base = per100gFor(f);
    const atwaterCal = (p: number, fat: number, c: number) => 4 * p + 9 * fat + 4 * c;
    const g = safeNum(primary?.grams || 100);
    const cal = Math.round((safeNum(base.cal) || atwaterCal(safeNum(base.p), safeNum(base.fat), safeNum(base.c))) * (g / 100));
    const p   = Math.round(safeNum(base.p)   * (g / 100));
    const fat = Math.round(safeNum(base.fat) * (g / 100));
    const c   = Math.round(safeNum(base.c)   * (g / 100));

    return (
      <div className="mt-1 flex items-center gap-2 flex-nowrap overflow-x-auto tabular-nums">
        {/* Cal */}
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap"
          style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
        >
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 leading-none text-center text-[9px]"
            style={{ backgroundColor: "#34D399", color: "#000" }}
          >
            Cal
          </span>
          {cal}
        </span>
        {/* P */}
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
          style={{ color: "#F87171", backgroundColor: "#F871711F" }}
        >
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
            style={{ backgroundColor: "#F87171", color: "#000" }}
          >
            P
          </span>
          {p}
        </span>
        {/* F */}
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
          style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
        >
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
            style={{ backgroundColor: "#FACC15", color: "#000" }}
          >
            F
          </span>
          {fat}
        </span>
        {/* C */}
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
          style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
        >
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
            style={{ backgroundColor: "#60A5FA", color: "#000" }}
          >
            C
          </span>
          {c}
        </span>
      </div>
    );
  };

  // compute live preview for quantity bubble
  const computePreview = (f: any) => {
    const base = per100gFor(f);
    const portions = buildPortions(f);
    const atwaterCal = (p: number, fat: number, c: number) => 4 * p + 9 * fat + 4 * c;

    if (mode === "servings") {
      const idx = Math.min(Math.max(selPortionIdx, 0), portions.length - 1);
      const gramsEach = safeNum(portions[idx]?.grams);
      const s = safeNum(servings);
      const gramsTotal = gramsEach * s;
      return {
        gramsTotal,
        cal: Math.round((safeNum(base.cal) || atwaterCal(safeNum(base.p), safeNum(base.fat), safeNum(base.c))) * (gramsTotal / 100)),
        p:   Math.round(safeNum(base.p)   * (gramsTotal / 100)),
        fat: Math.round(safeNum(base.fat) * (gramsTotal / 100)),
        c:   Math.round(safeNum(base.c)   * (gramsTotal / 100)),
      };
    }

    if (mode === "weight") {
      const g = safeNum(grams);
      return {
        gramsTotal: g,
        cal: Math.round((safeNum(base.cal) || atwaterCal(safeNum(base.p), safeNum(base.fat), safeNum(base.c))) * (g / 100)),
        p:   Math.round(safeNum(base.p)   * (g / 100)),
        fat: Math.round(safeNum(base.fat) * (g / 100)),
        c:   Math.round(safeNum(base.c)   * (g / 100)),
      };
    }

    // volume — use original portions index and ensure a household portion is selected
    const hasVol = portions.some((p) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label));
    let idx = selPortionIdx;
    if (
      !hasVol ||
      !(!isPureGramLabel(portions[idx]?.label) && hasHouseholdWords(portions[idx]?.label))
    ) {
      const firstVolIdx = portions.findIndex(
        (p) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label)
      );
      idx = firstVolIdx >= 0 ? firstVolIdx : 0;
    }
    const gramsEach = safeNum(portions[idx]?.grams || portions[0]?.grams || 100);
    const u = safeNum(units);
    const gramsTotal = gramsEach * u;
    return {
      gramsTotal,
      cal: Math.round((safeNum(base.cal) || (4*safeNum(base.p) + 9*safeNum(base.fat) + 4*safeNum(base.c))) * (gramsTotal / 100)),
      p:   Math.round(safeNum(base.p)   * (gramsTotal / 100)),
      fat: Math.round(safeNum(base.fat) * (gramsTotal / 100)),
      c:   Math.round(safeNum(base.c)   * (gramsTotal / 100)),
    };
  };

  // row ref map for anchoring (ensures bubble sits within each row)
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const setRowRef = (i: number) => (el: HTMLDivElement | null) => {
    rowRefs.current[i] = el;
  };

  // Quick Add helper functions
  const parseQty = (s: string) => {
    const v = Number((s ?? "").toString());
    return isFinite(v) ? v : 0;
  };
  const clampQty = (v: number) => Math.max(0, v);
  const incQty = (step = 1) => {
    setQuickAddForm((f) => ({ ...f, quantity: String(clampQty(parseQty(f.quantity ?? "0") + step)) }));
  };
  const decQty = (step = 1) => {
    setQuickAddForm((f) => ({ ...f, quantity: String(clampQty(parseQty(f.quantity ?? "0") - step)) }));
  };

  const handleQuickAddSave = () => {
    const name = quickAddForm.name.trim() || "Unnamed";
    const quantity = Number(quickAddForm.quantity) || 1;
    const cal = Number(quickAddForm.calories) || 0;
    const p = Number(quickAddForm.protein) || 0;
    const c = Number(quickAddForm.carbs) || 0;
    const f = Number(quickAddForm.fat) || 0;

    onPick({
      name,
      quantity,
      calories: cal,
      protein: p,
      fat: f,
      carbs: c,
    });

    setShowQuickAdd(false);
    setQuickAddForm({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      quantity: "1",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full-screen sheet */}
      <div className="fixed inset-0 z-[100002] bg-white dark:bg-neutral-900">
        {/* Sticky header with Back + search + Quick Add */}
        <div className="sticky top-0 p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
            onClick={onClose}
          >
            Back
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods"
            className="flex-1 rounded-full border px-3 py-2 bg-white dark:bg-neutral-900"
          />
          <button
            className="px-3 py-2 rounded-full border-2 bg-transparent transition-all hover:bg-opacity-5 whitespace-nowrap"
            style={{ borderColor: "var(--accent-diet)", color: "var(--accent-diet)" }}
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            +Custom
          </button>
        </div>

        {/* Quick Add Form */}
        {showQuickAdd && (
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-semibold mb-3">Quick Add</h3>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm col-span-2">
                  Name
                  <input
                    className="mt-1 w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={quickAddForm.name}
                    onChange={(e) => setQuickAddForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>

                <label className="text-sm">
                  Calories
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={quickAddForm.calories}
                    onChange={(e) =>
                      setQuickAddForm((f) => ({
                        ...f,
                        calories: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Protein
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={quickAddForm.protein}
                    onChange={(e) =>
                      setQuickAddForm((f) => ({
                        ...f,
                        protein: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Carbs
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={quickAddForm.carbs}
                    onChange={(e) =>
                      setQuickAddForm((f) => ({
                        ...f,
                        carbs: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Fat
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={quickAddForm.fat}
                    onChange={(e) =>
                      setQuickAddForm((f) => ({
                        ...f,
                        fat: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
              </div>

              {/* Quantity control */}
              <div className="pt-3">
                <label className="block text-sm mb-1">Quantity</label>
                <div className="flex items-center gap-2 justify-center">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 grid place-items-center text-xl"
                    onClick={() => decQty(1)}
                    aria-label="Decrease quantity"
                  >
                    –
                  </button>

                  <input
                    inputMode="decimal"
                    className="w-20 text-center h-10 rounded-full border border-neutral-300 dark:border-neutral-700 px-2 bg-white dark:bg-neutral-900"
                    value={quickAddForm.quantity ?? "1"}
                    onChange={(e) =>
                      setQuickAddForm((f) => ({
                        ...f,
                        quantity: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                    placeholder="1"
                  />

                  <button
                    type="button"
                    className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 grid place-items-center text-xl"
                    onClick={() => incQty(1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
                  onClick={() => {
                    setShowQuickAdd(false);
                    setQuickAddForm({
                      name: "",
                      calories: "",
                      protein: "",
                      carbs: "",
                      fat: "",
                      quantity: "1",
                    });
                  }}
                >
                  Cancel
                </button>
                <button className="px-3 py-2 rounded-full bg-accent-diet text-black" onClick={handleQuickAddSave}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <ul className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)] relative">
          {results.map((f, i) => {
            const portions = buildPortions(f);
            const householdPortions = portions.filter(
              (p) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label)
            );
            const primaryLabel = portions[0]?.label || f?.servingLabel || "100 g";
            const hasVolume = householdPortions.length > 0;
            const isActive = activeIdx === i;

            return (
              <li key={`${f.description}-${i}`}>
                <div
                  ref={setRowRef(i)}
                  className="relative rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-4 py-3 shadow-sm"
                >
                  <button
                    className="block text-left w-full"
                    onClick={() => {
                      // open bubble for this row, reset controls
                      setActiveIdx(i);
                      setMode("servings");
                      setSelPortionIdx(0);
                      setServings("1");
                      setGrams(String(portions[0]?.grams || 100));
                      setUnits("1");
                    }}
                  >
                    <div className="font-semibold leading-tight break-words">{f.description || "Unnamed"}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{primaryLabel}</div>
                    <ChipRow f={f} />
                  </button>
                </div>

                {/* Portal quantity bubble + local backdrop with blur */}
                {isActive && typeof document !== "undefined" && createPortal(
                  <>
                    {/* Backdrop that closes only the quantity bubble, not the whole search - with blur */}
                    <button
                      className="fixed inset-0 z-[100009] bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                      aria-label="Close quantity"
                      onClick={() => setActiveIdx(null)}
                    />
                    {/* Centered modal with food name at top */}
                    <div className="fixed inset-0 z-[100010] flex items-center justify-center p-4">
                      <div className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-4">
                        {/* Food name prominently at top */}
                        <h3 className="font-semibold text-lg mb-3">{f.description || "Unnamed"}</h3>
                        {/* Segmented control */}
                        <div className="grid grid-cols-3 gap-1 text-sm mb-3">
                          {(["servings", "weight", "volume"] as const).map((m) => (
                            <button
                              key={m}
                              className={
                                "px-2 py-1 rounded-md border " +
                                (mode === m
                                  ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                                  : "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800")
                              }
                              onClick={() => {
                                setMode(m);
                                if (m === "volume") {
                                  const parts = buildPortions(results[i]);
                                  const firstVolIdx = parts.findIndex(
                                    (p) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label)
                                  );
                                  if (firstVolIdx >= 0) setSelPortionIdx(firstVolIdx);
                                } else if (m === "servings") {
                                  setSelPortionIdx(0);
                                }
                              }}
                              disabled={
                                m === "volume" &&
                                !buildPortions(results[i]).some((p) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label))
                              }
                            >
                              {m === "servings" ? "Servings" : m === "weight" ? "Weight (g)" : "Volume"}
                            </button>
                          ))}
                        </div>

                        {/* Mode content */}
                        {mode === "servings" && (
                          <div className="space-y-2">
                            <label className="block text-sm">
                              Portion
                              <select
                                className="mt-1 w-full rounded-full border px-2 py-2 bg-white dark:bg-neutral-900"
                                value={selPortionIdx}
                                onChange={(e) => setSelPortionIdx(Number(e.target.value))}
                              >
                                {buildPortions(results[i]).map((p, idx) => (
                                  <option key={idx} value={idx}>
                                    {p.label} ({p.grams} g)
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block text-sm">
                              Servings
                              <div className="mt-1 flex items-center gap-2">
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                                  onClick={() =>
                                    setServings((s) => {
                                      const v = safeNum(s) - 1;
                                      return String(v < 0 ? 0 : v);
                                    })
                                  }
                                >
                                  –
                                </button>
                                <input
                                  inputMode="decimal"
                                  className="w-16 text-center h-10 rounded-full border border-neutral-300 dark:border-neutral-700 px-2 bg-white dark:bg-neutral-900"
                                  value={servings}
                                  onChange={(e) =>
                                    setServings(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))
                                  }
                                />
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                                  onClick={() => setServings((s) => String(safeNum(s) + 1))}
                                >
                                  +
                                </button>
                              </div>
                            </label>
                          </div>
                        )}

                        {mode === "weight" && (
                          <div className="space-y-2">
                            <label className="block text-sm">
                              Grams
                              <div className="mt-1 flex items-center gap-2">
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                                  onClick={() =>
                                    setGrams((g) => {
                                      const v = safeNum(g) - 10;
                                      return String(v < 0 ? 0 : v);
                                    })
                                  }
                                >
                                  –
                                </button>
                                <input
                                  inputMode="decimal"
                                  className="w-20 text-center h-10 rounded-full border border-neutral-300 dark:border-neutral-700 px-2 bg-white dark:bg-neutral-900"
                                  value={grams}
                                  onChange={(e) =>
                                    setGrams(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))
                                  }
                                />
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                                  onClick={() => setGrams((g) => String(safeNum(g) + 10))}
                                >
                                  +
                                </button>
                              </div>
                            </label>
                          </div>
                        )}

                        {mode === "volume" && (
                          <div className="space-y-2">
                            <label className="block text-sm">
                              Unit
                              <select
                                className="mt-1 w-full rounded-full border px-2 py-2 bg-white dark:bg-neutral-900"
                                value={(function () {
                                  const parts = buildPortions(results[i]);
                                  const volIdxs = parts
                                    .map((p, idx) => ({ p, idx }))
                                    .filter(({ p }) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label))
                                    .map(({ idx }) => idx);
                                  if (volIdxs.length === 0) return 0;
                                  return volIdxs.includes(selPortionIdx) ? selPortionIdx : volIdxs[0];
                                })()}
                                onChange={(e) => setSelPortionIdx(Number(e.target.value))}
                              >
                                {buildPortions(results[i])
                                  .map((p, idx) => ({ p, idx }))
                                  .filter(({ p }) => !isPureGramLabel(p.label) && hasHouseholdWords(p.label))
                                  .map(({ p, idx }) => (
                                    <option key={idx} value={idx}>
                                      {p.label} ({p.grams} g)
                                    </option>
                                  ))}
                              </select>
                            </label>

                            <label className="block text-sm">
                              Units
                              <div className="mt-1 flex items-center gap-2">
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                                  onClick={() =>
                                    setUnits((u) => {
                                      const v = safeNum(u) - 1;
                                      return String(v < 0 ? 0 : v);
                                    })
                                  }
                                >
                                  –
                                </button>
                                <input
                                  inputMode="decimal"
                                  className="w-16 text-center h-10 rounded-full border border-neutral-300 dark:border-neutral-700 px-2 bg-white dark:bg-neutral-900"
                                  value={units}
                                  onChange={(e) =>
                                    setUnits(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))
                                  }
                                />
                                <button
                                  type="button"
                                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 grid place-items-center text-xl"
                                  onClick={() => setUnits((u) => String(safeNum(u) + 1))}
                                >
                                  +
                                </button>
                              </div>
                            </label>
                          </div>
                        )}

                        {/* Live macro preview + actions */}
                        {(() => {
                          const pv = computePreview(results[i]);
                          return (
                            <>
                              <div className="mt-3">
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {`Preview • ${Math.round(pv.gramsTotal)} g`}
                                </div>
                                <div className="mt-1 flex items-center gap-2 flex-nowrap overflow-x-auto tabular-nums">
                                  <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap"
                                    style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
                                  >
                                    <span
                                      className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 leading-none text-center text-[9px]"
                                      style={{ backgroundColor: "#34D399", color: "#000" }}
                                    >
                                      Cal
                                    </span>
                                    {pv.cal}
                                  </span>
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
                                    style={{ color: "#F87171", backgroundColor: "#F871711F" }}
                                  >
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                                      style={{ backgroundColor: "#F87171", color: "#000" }}
                                    >
                                      P
                                    </span>
                                    {pv.p}
                                  </span>
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
                                    style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
                                  >
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                                      style={{ backgroundColor: "#FACC15", color: "#000" }}
                                    >
                                      F
                                    </span>
                                    {pv.fat}
                                  </span>
                                  <span
                                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
                                    style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
                                  >
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                                      style={{ backgroundColor: "#60A5FA", color: "#000" }}
                                    >
                                      C
                                    </span>
                                    {pv.c}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
                                  onClick={() => setActiveIdx(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="px-3 py-2 rounded-full bg-[#34D399] text-black"
                                  onClick={() => {
                                    onPick({
                                      name: results[i]?.description || "Unnamed",
                                      quantity: 1,
                                      calories: pv.cal,
                                      protein: pv.p,
                                      fat: pv.fat,
                                      carbs: pv.c,
                                    });
                                    setActiveIdx(null);
                                    onClose();
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </li>
            );
          })}

          {/* Empty state */}
          {loaded && results.length === 0 && (
            <li className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">
              No matches. Try a different search.
            </li>
          )}
        </ul>
      </div>
    </>
  );
}