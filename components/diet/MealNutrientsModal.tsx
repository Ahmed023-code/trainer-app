"use client";

import { useEffect, useState, useMemo } from "react";
import { getFoodDetails, type USDANutrient } from "@/lib/usda-db-v2";
import type { Meal } from "./types";

type Props = {
  isOpen: boolean;
  meal: Meal | null;
  onClose: () => void;
};

// Nutrient categories for organization
const NUTRIENT_CATEGORIES = {
  "Macronutrients": [1008, 1003, 1004, 1005, 1079], // Energy, Protein, Fat, Carbs, Fiber
  "Vitamins": [1106, 1109, 1114, 1162, 1165, 1166, 1167, 1170, 1175, 1176, 1177, 1178, 1180], // A, C, D, K, etc
  "Minerals": [1087, 1089, 1090, 1091, 1092, 1093, 1095, 1096, 1098, 1099, 1100, 1101, 1103, 1104], // Calcium, Iron, Magnesium, etc
  "Fats": [1258, 1259, 1292, 1293], // Saturated, Monounsaturated, Polyunsaturated
  "Amino Acids": [1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1218, 1219, 1220, 1221], // Essential amino acids
};

const NUTRIENT_NAMES: Record<number, string> = {
  1008: "Calories",
  1003: "Protein",
  1004: "Total Fat",
  1005: "Carbohydrates",
  1079: "Fiber",
  1087: "Calcium",
  1089: "Iron",
  1090: "Magnesium",
  1091: "Phosphorus",
  1092: "Potassium",
  1093: "Sodium",
  1095: "Zinc",
  1098: "Copper",
  1106: "Vitamin A",
  1109: "Vitamin C",
  1114: "Vitamin D",
  1162: "Vitamin B6",
  1165: "Vitamin B12",
  1166: "Thiamin (B1)",
  1167: "Riboflavin (B2)",
  1170: "Folate",
  1175: "Vitamin E",
  1176: "Niacin (B3)",
  1177: "Pantothenic Acid (B5)",
  1178: "Vitamin K",
  1258: "Saturated Fat",
  1259: "Monounsaturated Fat",
  1292: "Polyunsaturated Fat",
  1293: "Trans Fat",
};

export default function MealNutrientsModal({ isOpen, meal, onClose }: Props) {
  const [nutrientTotals, setNutrientTotals] = useState<Map<number, { name: string; amount: number; unit: string }>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !meal) {
      setNutrientTotals(new Map());
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const totals = new Map<number, { name: string; amount: number; unit: string }>();

      // Load nutrient data for each food item
      for (const item of meal.items) {
        if (!item.fdcId) continue;

        try {
          const details = await getFoodDetails(item.fdcId);
          if (!details || cancelled) continue;

          const quantity = item.quantity || 1;
          const gramsPerUnit = item.gramsPerUnit || 100;
          const totalGrams = quantity * gramsPerUnit;

          // Aggregate nutrients
          for (const nutrient of details.nutrients) {
            // Scale nutrient amount from per-100g to total grams
            const scaledAmount = (nutrient.amount / 100) * totalGrams;

            const existing = totals.get(nutrient.id);
            if (existing) {
              totals.set(nutrient.id, {
                ...existing,
                amount: existing.amount + scaledAmount
              });
            } else {
              totals.set(nutrient.id, {
                name: nutrient.name || NUTRIENT_NAMES[nutrient.id] || `Nutrient ${nutrient.id}`,
                amount: scaledAmount,
                unit: nutrient.unit_name || "g"
              });
            }
          }
        } catch (err) {
          console.error(`Error loading nutrients for ${item.name}:`, err);
        }
      }

      if (!cancelled) {
        setNutrientTotals(totals);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, meal]);

  // Organize nutrients by category
  const organizedNutrients = useMemo(() => {
    const result: Record<string, Array<{ id: number; name: string; amount: number; unit: string }>> = {};

    for (const [category, nutrientIds] of Object.entries(NUTRIENT_CATEGORIES)) {
      const nutrients = nutrientIds
        .map(id => {
          const nutrient = nutrientTotals.get(id);
          if (!nutrient) return null;
          return { id, ...nutrient };
        })
        .filter(Boolean) as Array<{ id: number; name: string; amount: number; unit: string }>;

      if (nutrients.length > 0) {
        result[category] = nutrients;
      }
    }

    // Add "Other" category for nutrients not in predefined categories
    const categorizedIds = new Set(Object.values(NUTRIENT_CATEGORIES).flat());
    const other: Array<{ id: number; name: string; amount: number; unit: string }> = [];

    nutrientTotals.forEach((nutrient, id) => {
      if (!categorizedIds.has(id)) {
        other.push({ id, ...nutrient });
      }
    });

    if (other.length > 0) {
      result["Other Nutrients"] = other.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [nutrientTotals]);

  if (!isOpen || !meal) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        className="fixed inset-0 z-[100011] bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100012] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-xl">{meal.name} - Nutrient Breakdown</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {meal.items.length} food item{meal.items.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                Loading nutrient data...
              </div>
            )}

            {!loading && nutrientTotals.size === 0 && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                No nutrient data available for this meal.
                <div className="text-xs mt-2">Foods must be from the USDA database to show detailed nutrients.</div>
              </div>
            )}

            {!loading && nutrientTotals.size > 0 && (
              <div className="space-y-6">
                {Object.entries(organizedNutrients).map(([category, nutrients]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3 text-neutral-700 dark:text-neutral-300">
                      {category}
                    </h3>
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-700">
                            <th className="text-left p-3 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                              Nutrient
                            </th>
                            <th className="text-right p-3 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {nutrients.map((nutrient, idx) => (
                            <tr
                              key={nutrient.id}
                              className={idx !== nutrients.length - 1 ? "border-b border-neutral-200 dark:border-neutral-700" : ""}
                            >
                              <td className="p-3 text-sm">{nutrient.name}</td>
                              <td className="p-3 text-sm text-right tabular-nums font-medium">
                                {nutrient.amount < 0.01 && nutrient.amount > 0
                                  ? "< 0.01"
                                  : nutrient.amount.toFixed(nutrient.amount < 1 ? 2 : 1)}{" "}
                                {nutrient.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              className="w-full px-4 py-3 rounded-full bg-accent-diet text-black font-medium hover:opacity-90 transition-opacity"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
