"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchFoods, getFoodDetails, preloadEssentials, type USDAFood, type FoodDetails, type USDANutrient } from "@/lib/usda-db-v2";
import MicronutrientsModal from './MicronutrientsModal';
import BarcodeScanner from './BarcodeScanner';
import { Barcode, Info } from 'lucide-react';

// Props contract updated to include unit and USDA metadata
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
    unit?: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fdcId?: number;
    gramsPerUnit?: number;
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

  // Convert text to title case (first letter of each word capitalized)
  const toTitleCase = (str: string): string => {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  };

  // ---------- data state ----------
  const [searchResults, setSearchResults] = useState<USDAFood[]>([]);
  const [loadedDetails, setLoadedDetails] = useState<Record<number, FoodDetails>>({});
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  // ---------- search state ----------
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Search foods via database
  useEffect(() => {
    if (!isOpen || !debounced) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Show database loading on first search
        if (!dbLoading && searchResults.length === 0) {
          setDbLoading(true);
        }

        const result = await searchFoods(debounced, { limit: 50, includeCache: true });

        if (!cancelled) {
          setSearchResults(result.offlineResults);
          setLoading(false);
          setDbLoading(false);

          // Preload nutrition data for first 10 results
          const preloadFoods = result.offlineResults.slice(0, 10);
          for (const food of preloadFoods) {
            if (!loadedDetails[food.fdc_id]) {
              loadFoodDetails(food.fdc_id);
            }
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        if (!cancelled) {
          setSearchResults([]);
          setLoading(false);
          setDbLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, debounced]);

  // Load full food details (nutrients + portions) when needed
  const loadFoodDetails = async (fdcId: number, cacheReason: 'viewed' | 'logged' = 'viewed') => {
    if (loadedDetails[fdcId]) return; // Already loaded

    try {
      const data = await getFoodDetails(fdcId, { cacheReason });
      if (data) {
        setLoadedDetails(prev => ({ ...prev, [fdcId]: data }));
      }
    } catch (err) {
      console.error('Error loading food details:', err);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setDbLoading(true);

    try {
      const { lookupByBarcode } = await import('@/lib/usda-db-v2');
      const details = await lookupByBarcode(barcode);

      if (details) {
        // Add to loaded details and search results
        setLoadedDetails(prev => ({ ...prev, [details.food.fdc_id]: details }));
        setSearchResults(prev => [details.food as USDAFood, ...prev].slice(0, 50));
        setQuery(details.food.description);
      } else {
        // Barcode not found - show QuickAdd form with barcode pre-filled
        setQuery('');
        setSearchResults([]);
        setShowQuickAdd(true);
        setQuickAddForm({
          name: `Product (UPC: ${barcode})`,
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          quantity: '1',
        });
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
      alert('Error looking up barcode');
    } finally {
      setDbLoading(false);
    }
  };

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
  const [mode, setMode] = useState<"servings" | "weight">("servings");
  const [selPortionIdx, setSelPortionIdx] = useState(0);
  const [servings, setServings] = useState("1");
  const [grams, setGrams] = useState("100");

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

  // ---------- new modal states ----------
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [selectedFoodForMicros, setSelectedFoodForMicros] = useState<{ name: string; nutrients: USDANutrient[]; servingGrams: number } | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Preload essential bundles on mount
  useEffect(() => {
    if (isOpen) {
      preloadEssentials().catch(err => console.error('Error preloading:', err));
    }
  }, [isOpen]);

  // Extract macros from nutrients array
  const getMacrosFromNutrients = (nutrients: USDANutrient[]) => {
    const getAmount = (names: string[]) => {
      const nutrient = nutrients.find(n => names.some(name =>
        n.name.toLowerCase().includes(name.toLowerCase())
      ));
      return nutrient ? safeNum(nutrient.amount) : 0;
    };

    const protein = getAmount(['Protein']);
    const fat = getAmount(['Total lipid', 'fat']);
    const carbs = getAmount(['Carbohydrate, by difference', 'carbohydrate']);
    let calories = getAmount(['Energy']);

    // If calories is in kJ, look for kcal specifically
    const kcalNutrient = nutrients.find(n =>
      n.name.toLowerCase() === 'energy' && n.unit_name.toUpperCase() === 'KCAL'
    );
    if (kcalNutrient) {
      calories = safeNum(kcalNutrient.amount);
    }

    // Fallback: calculate from macros (Atwater factors)
    if (calories === 0 && (protein > 0 || fat > 0 || carbs > 0)) {
      calories = Math.round(protein * 4 + fat * 9 + carbs * 4);
    }

    return { calories, protein, fat, carbs };
  };

  // Build portions array from food details
  const buildPortions = (fdcId: number): { label: string; grams: number }[] => {
    const details = loadedDetails[fdcId];
    if (!details || !details.portions || details.portions.length === 0) {
      return [{ label: '100 g', grams: 100 }];
    }

    return details.portions.map(p => ({
      label: p.portion_description || `${p.gram_weight} g`,
      grams: p.gram_weight
    }));
  };

  // Get per-100g macros for a food
  const per100gFor = (fdcId: number) => {
    const details = loadedDetails[fdcId];
    if (!details || !details.nutrients) {
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }

    return getMacrosFromNutrients(details.nutrients);
  };

  // ---------- chips UI ----------
  const ChipRow = ({ fdcId }: { fdcId: number }) => {
    const details = loadedDetails[fdcId];
    if (!details) return <div className="text-xs text-neutral-400">Loading nutrition...</div>;

    const base = per100gFor(fdcId);
    const portions = buildPortions(fdcId);
    const g = safeNum(portions[0]?.grams || 100);

    const cal = Math.round(base.calories * (g / 100));
    const p = Math.round(base.protein * (g / 100));
    const fat = Math.round(base.fat * (g / 100));
    const c = Math.round(base.carbs * (g / 100));

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
  const computePreview = (fdcId: number) => {
    const base = per100gFor(fdcId);
    const portions = buildPortions(fdcId);

    if (mode === "servings") {
      const idx = Math.min(Math.max(selPortionIdx, 0), portions.length - 1);
      const gramsEach = safeNum(portions[idx]?.grams);
      const s = safeNum(servings);
      const gramsTotal = gramsEach * s;
      return {
        gramsTotal,
        cal: Math.round(base.calories * (gramsTotal / 100)),
        p: Math.round(base.protein * (gramsTotal / 100)),
        fat: Math.round(base.fat * (gramsTotal / 100)),
        c: Math.round(base.carbs * (gramsTotal / 100)),
      };
    }

    if (mode === "weight") {
      const g = safeNum(grams);
      return {
        gramsTotal: g,
        cal: Math.round(base.calories * (g / 100)),
        p: Math.round(base.protein * (g / 100)),
        fat: Math.round(base.fat * (g / 100)),
        c: Math.round(base.carbs * (g / 100)),
      };
    }

    return { gramsTotal: 100, cal: 0, p: 0, fat: 0, c: 0 };
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
        {/* Sticky header with Back + search + Barcode + Quick Add */}
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
            placeholder="Search 155K+ foods..."
            className="flex-1 rounded-full border px-3 py-2 bg-white dark:bg-neutral-900"
          />
          <button
            className="p-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => setShowBarcodeScanner(true)}
            title="Scan Barcode"
          >
            <Barcode className="w-5 h-5" />
          </button>
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
          {dbLoading && (
            <li className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">
              <div className="font-semibold mb-2">Loading nutrition database...</div>
              <div className="text-xs">First load may take a moment (2.1 GB)</div>
            </li>
          )}

          {!dbLoading && loading && (
            <li className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">
              Searching...
            </li>
          )}

          {!dbLoading && !loading && debounced && searchResults.length === 0 && (
            <li className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">
              No matches. Try a different search.
            </li>
          )}

          {!dbLoading && !loading && !debounced && (
            <li className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-8">
              Search for foods by name or use the barcode scanner
            </li>
          )}

          {searchResults.map((food, i) => {
            const isActive = activeIdx === i;
            const hasDetails = !!loadedDetails[food.fdc_id];

            return (
              <li key={`${food.fdc_id}-${i}`}>
                <div
                  ref={setRowRef(i)}
                  className="relative rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-4 py-3 shadow-sm"
                >
                  <button
                    className="block text-left w-full"
                    onClick={async () => {
                      // Load details if not already loaded
                      if (!hasDetails) {
                        await loadFoodDetails(food.fdc_id);
                      }

                      // Open bubble for this row, reset controls to default serving
                      const portions = buildPortions(food.fdc_id);
                      setActiveIdx(i);
                      setMode("servings");
                      setSelPortionIdx(0);
                      setServings("1");
                      setGrams(String(portions[0]?.grams || 100));
                    }}
                  >
                    <div className="font-semibold leading-tight break-words">{toTitleCase(food.description)}</div>
                    {food.brand_name && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{toTitleCase(food.brand_name)}</div>
                    )}
                    {!food.brand_name && food.data_type !== 'branded_food' && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Generic</div>
                    )}
                    {hasDetails && <ChipRow fdcId={food.fdc_id} />}
                  </button>
                </div>

                {/* Portal quantity bubble + local backdrop with blur */}
                {isActive && hasDetails && typeof document !== "undefined" && createPortal(
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
                        <h3 className="font-semibold text-lg mb-3">{toTitleCase(food.description)}</h3>
                        {food.brand_name && (
                          <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                            {toTitleCase(food.brand_name)}
                          </div>
                        )}

                        {/* Segmented control */}
                        <div className="grid grid-cols-2 gap-1 text-sm mb-3">
                          {(["servings", "weight"] as const).map((m) => (
                            <button
                              key={m}
                              className={
                                "px-2 py-1 rounded-md border " +
                                (mode === m
                                  ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                                  : "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800")
                              }
                              onClick={() => setMode(m)}
                            >
                              {m === "servings" ? "Servings" : "Weight (g)"}
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
                                {buildPortions(food.fdc_id).map((p, idx) => (
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

                        {/* Live macro preview + actions */}
                        {(() => {
                          const pv = computePreview(food.fdc_id);
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

                              <div className="mt-3 flex justify-between gap-2">
                                <button
                                  className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                                  onClick={() => {
                                    const details = loadedDetails[food.fdc_id];
                                    const pv = computePreview(food.fdc_id);
                                    if (details) {
                                      setSelectedFoodForMicros({
                                        name: toTitleCase(food.description),
                                        nutrients: details.nutrients,
                                        servingGrams: pv.gramsTotal
                                      });
                                      setShowMicronutrients(true);
                                    }
                                  }}
                                  title="View All Nutrients"
                                >
                                  <Info className="w-4 h-4" />
                                  Details
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
                                    onClick={() => setActiveIdx(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="px-3 py-2 rounded-full bg-[#34D399] text-black"
                                    onClick={() => {
                                      // Cache as logged when user adds food
                                      loadFoodDetails(food.fdc_id, 'logged');

                                      // Determine unit based on mode
                                      const portions = buildPortions(food.fdc_id);
                                      let unit = "g";
                                      let gramsPerUnit = pv.gramsTotal;

                                      if (mode === "servings" && portions.length > 0) {
                                        const selectedPortion = portions[selPortionIdx];
                                        unit = selectedPortion.label;
                                        gramsPerUnit = selectedPortion.grams;
                                      }

                                      onPick({
                                        name: food.description,
                                        quantity: 1,
                                        unit,
                                        calories: pv.cal,
                                        protein: pv.p,
                                        fat: pv.fat,
                                        carbs: pv.c,
                                        fdcId: food.fdc_id,
                                        gramsPerUnit,
                                      });
                                      setActiveIdx(null);
                                      onClose();
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
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
        </ul>
      </div>

      {/* Micronutrients Modal */}
      {selectedFoodForMicros && (
        <MicronutrientsModal
          isOpen={showMicronutrients}
          onClose={() => {
            setShowMicronutrients(false);
            setSelectedFoodForMicros(null);
          }}
          foodName={selectedFoodForMicros.name}
          nutrients={selectedFoodForMicros.nutrients}
          servingGrams={selectedFoodForMicros.servingGrams}
        />
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />
    </>
  );
}
