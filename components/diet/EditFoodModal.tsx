"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getFoodDetails, type FoodDetails } from "@/lib/usda-db-v2";
import MicronutrientsModal from './MicronutrientsModal';
import { Info } from 'lucide-react';
import type { FoodItem } from "./types";

type Props = {
  isOpen: boolean;
  foodItem: FoodItem;
  onClose: () => void;
  onSave: (item: FoodItem) => void;
};

export default function EditFoodModal({ isOpen, foodItem, onClose, onSave }: Props) {
  // Helper functions
  const safeNum = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "string" && v.trim() === "") return 0;
    const s = String(v).replace(/,/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  // Food details from USDA database (if available)
  const [foodDetails, setFoodDetails] = useState<FoodDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Mode: servings or weight
  const [mode, setMode] = useState<"servings" | "weight">("servings");

  // Servings mode state
  const [selPortionIdx, setSelPortionIdx] = useState(0);
  const [servings, setServings] = useState("1");

  // Weight mode state
  const [grams, setGrams] = useState("100");

  // Micronutrients modal
  const [showMicronutrients, setShowMicronutrients] = useState(false);

  // Load USDA details if fdcId is available
  useEffect(() => {
    if (!isOpen || !foodItem.fdcId) {
      setFoodDetails(null);
      return;
    }

    let cancelled = false;
    setLoadingDetails(true);

    (async () => {
      try {
        const details = await getFoodDetails(foodItem.fdcId!);
        if (!cancelled && details) {
          setFoodDetails(details);
        }
      } catch (err) {
        console.error('Error loading food details:', err);
      } finally {
        if (!cancelled) {
          setLoadingDetails(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, foodItem.fdcId]);

  // Initialize state from foodItem
  useEffect(() => {
    if (!isOpen) return;

    const qty = foodItem.quantity || 1;
    const gramsTotal = (foodItem.gramsPerUnit || 100) * qty;

    // Determine initial mode based on unit
    if (foodItem.unit === "g") {
      setMode("weight");
      setGrams(String(gramsTotal));
      setServings("1");
    } else {
      setMode("servings");
      setServings(String(qty));
      setGrams(String(gramsTotal));

      // Try to find matching portion index
      const portions = buildPortions();
      const matchIdx = portions.findIndex(p => {
        // Match by exact label or by gram weight
        return p.label === foodItem.unit ||
               (p.grams === (foodItem.gramsPerUnit || 100));
      });
      if (matchIdx >= 0) {
        setSelPortionIdx(matchIdx);
      } else {
        // Default to first portion if no match
        setSelPortionIdx(0);
      }
    }
  }, [isOpen, foodItem, foodDetails]);

  // Build portions list
  const buildPortions = () => {
    if (!foodDetails) {
      // Fallback if no USDA data: create a simple portion based on current item
      return [{
        label: foodItem.unit || "serving",
        grams: foodItem.gramsPerUnit || 100
      }];
    }

    const portions: { label: string; grams: number }[] = [];

    // Add 100g as default first option
    portions.push({ label: "100g", grams: 100 });

    // Add portions from USDA data
    if (foodDetails.portions && foodDetails.portions.length > 0) {
      for (const p of foodDetails.portions) {
        if (p.gram_weight && p.gram_weight > 0) {
          let label = p.portion_description || "serving";

          // Include gram weight in label for clarity
          label = `${label} (${Math.round(p.gram_weight)}g)`;

          portions.push({
            label,
            grams: p.gram_weight
          });
        }
      }
    }

    // If no portions, add a default serving
    if (portions.length === 1) {
      portions.push({ label: "1 serving (100g)", grams: 100 });
    }

    return portions;
  };

  // Get nutrition per 100g
  const per100g = () => {
    if (!foodDetails) {
      // Calculate from current foodItem
      const gramsPerUnit = foodItem.gramsPerUnit || 100;
      const factor = 100 / gramsPerUnit;
      return {
        calories: foodItem.calories * factor,
        protein: foodItem.protein * factor,
        fat: foodItem.fat * factor,
        carbs: foodItem.carbs * factor
      };
    }

    // Get from USDA data
    const getVal = (id: number) => {
      const nut = foodDetails.nutrients.find(n => n.id === id);
      return safeNum(nut?.amount);
    };

    return {
      calories: getVal(1008),  // Energy (kcal)
      protein: getVal(1003),   // Protein
      fat: getVal(1004),       // Total fat
      carbs: getVal(1005)      // Carbs
    };
  };

  // Compute live preview
  const computePreview = () => {
    const base = per100g();

    if (mode === "servings") {
      const portions = buildPortions();
      const idx = Math.min(Math.max(selPortionIdx, 0), portions.length - 1);
      const gramsEach = safeNum(portions[idx]?.grams);
      const s = safeNum(servings);
      const gramsTotal = gramsEach * s;

      return {
        gramsTotal,
        gramsPerUnit: gramsEach,
        quantity: s,
        unit: portions[idx]?.label || "serving",
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
        gramsPerUnit: g,
        quantity: 1,
        unit: "g",
        cal: Math.round(base.calories * (g / 100)),
        p: Math.round(base.protein * (g / 100)),
        fat: Math.round(base.fat * (g / 100)),
        c: Math.round(base.carbs * (g / 100)),
      };
    }

    return { gramsTotal: 100, gramsPerUnit: 100, quantity: 1, unit: "g", cal: 0, p: 0, fat: 0, c: 0 };
  };

  const handleSave = () => {
    const pv = computePreview();
    const base = per100g();

    // Save per-unit values (not totals) so that multiplication by quantity works correctly
    const perUnit = {
      calories: Math.round(base.calories * (pv.gramsPerUnit / 100)),
      protein: Math.round(base.protein * (pv.gramsPerUnit / 100)),
      fat: Math.round(base.fat * (pv.gramsPerUnit / 100)),
      carbs: Math.round(base.carbs * (pv.gramsPerUnit / 100)),
    };

    onSave({
      ...foodItem,
      quantity: pv.quantity,
      unit: pv.unit,
      gramsPerUnit: pv.gramsPerUnit,
      calories: perUnit.calories,
      protein: perUnit.protein,
      fat: perUnit.fat,
      carbs: perUnit.carbs,
    });

    onClose();
  };

  if (!isOpen) return null;

  const pv = computePreview();
  const portions = buildPortions();

  return (
    <>
      {/* Backdrop that closes the quantity modal - with blur */}
      <button
        className="fixed inset-0 z-[100009] bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        aria-label="Close quantity"
        onClick={onClose}
      />

      {/* Centered modal with food name at top */}
      <div className="fixed inset-0 z-[100010] flex items-center justify-center p-4">
        <div className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-4">
          {/* Food name prominently at top */}
          <h3 className="font-semibold text-lg mb-3">{foodItem.name}</h3>

          {/* Always show mode toggle and full interface */}
          <>
            {/* Segmented control */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                {(["servings", "weight"] as const).map((m) => (
                  <button
                    key={m}
                    className={
                      "px-4 py-2 rounded-full border transition-colors " +
                      (mode === m
                        ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                        : "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800")
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
                      {portions.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.label}
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
          </>

          {/* Live macro preview */}
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
            {/* Details button - only if we have USDA data */}
            {foodItem.fdcId && foodDetails && (
              <button
                className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                onClick={() => setShowMicronutrients(true)}
                title="View All Nutrients"
              >
                <Info className="w-4 h-4" />
                Details
              </button>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                className="px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded-full bg-[#34D399] text-black"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Micronutrients Modal */}
      {foodItem.fdcId && foodDetails && (
        <MicronutrientsModal
          isOpen={showMicronutrients}
          onClose={() => setShowMicronutrients(false)}
          foodName={foodItem.name}
          nutrients={foodDetails.nutrients}
          servingGrams={pv.gramsTotal}
        />
      )}
    </>
  );
}
