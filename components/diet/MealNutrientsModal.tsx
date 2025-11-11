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
  "Macronutrients": [1008, 1003, 1004, 1005, 1079, 2000], // Energy, Protein, Fat, Carbs, Fiber, Sugars
  "Vitamins": [1106, 1109, 1114, 1162, 1165, 1166, 1167, 1170, 1175, 1176, 1177, 1178, 1180, 1183, 1184, 1185, 1186, 1187, 1190], // A, C, D, K, B vitamins, etc
  "Minerals": [1087, 1089, 1090, 1091, 1092, 1093, 1095, 1096, 1098, 1099, 1100, 1101, 1103, 1104, 1097, 1102], // Calcium, Iron, Magnesium, Phosphorus, Potassium, Sodium, Zinc, etc
  "Fats": [1258, 1259, 1292, 1293], // Saturated, Monounsaturated, Polyunsaturated, Trans
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
        const quantity = item.quantity || 1;

        if (item.fdcId) {
          // Food from USDA database - load detailed nutrients
          try {
            const details = await getFoodDetails(item.fdcId, { cacheReason: 'viewed' });
            if (!details || cancelled) continue;

            console.log(`[MealNutrients] Loaded ${details.nutrients.length} nutrients for ${item.name}`);
            console.log(`[MealNutrients] First 5 nutrients:`, details.nutrients.slice(0, 5));

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
        } else {
          // Custom food - add basic macros
          const addNutrient = (id: number, amount: number, unit: string) => {
            if (amount <= 0) return;
            const existing = totals.get(id);
            if (existing) {
              totals.set(id, { ...existing, amount: existing.amount + (amount * quantity) });
            } else {
              totals.set(id, { name: NUTRIENT_NAMES[id] || `Nutrient ${id}`, amount: amount * quantity, unit });
            }
          };

          addNutrient(1008, item.calories, 'kcal');
          addNutrient(1003, item.protein, 'g');
          addNutrient(1004, item.fat, 'g');
          addNutrient(1005, item.carbs, 'g');
        }
      }

      if (!cancelled) {
        console.log(`[MealNutrients] Total unique nutrients aggregated: ${totals.size}`);
        console.log('[MealNutrients] Nutrient IDs:', Array.from(totals.keys()));
        setNutrientTotals(totals);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, meal]);

  // Organize nutrients by category - categorize by nutrient name instead of ID
  const organizedNutrients = useMemo(() => {
    const result: Record<string, Array<{ id: number; name: string; amount: number; unit: string }>> = {};

    // Helper to categorize by nutrient name
    const categorizeByName = (name: string): string => {
      const lowerName = name.toLowerCase();

      // Macronutrients
      if (lowerName.includes('energy') || lowerName.includes('calorie')) return 'Macronutrients';
      if (lowerName.includes('protein') && !lowerName.includes('alanine') && !lowerName.includes('arginine')) return 'Macronutrients';
      if (lowerName.includes('carbohydrate') || lowerName.includes('sugars') || lowerName.includes('fiber')) return 'Macronutrients';
      if ((lowerName === 'total lipid (fat)' || lowerName.includes('total fat')) && !lowerName.includes('fatty')) return 'Macronutrients';

      // Fats
      if (lowerName.includes('saturated') || lowerName.includes('monounsaturated') ||
          lowerName.includes('polyunsaturated') || lowerName.includes('trans fat')) return 'Fats';
      if (lowerName.includes('fatty acids') || lowerName.includes('cholesterol')) return 'Fats';

      // Vitamins
      if (lowerName.includes('vitamin')) return 'Vitamins';
      if (lowerName.includes('thiamin') || lowerName.includes('riboflavin') ||
          lowerName.includes('niacin') || lowerName.includes('folate') ||
          lowerName.includes('choline')) return 'Vitamins';

      // Minerals
      if (lowerName.includes('calcium') || lowerName.includes('iron') ||
          lowerName.includes('magnesium') || lowerName.includes('phosphorus') ||
          lowerName.includes('potassium') || lowerName.includes('sodium') ||
          lowerName.includes('zinc') || lowerName.includes('copper') ||
          lowerName.includes('manganese') || lowerName.includes('selenium')) return 'Minerals';

      // Amino Acids
      if (lowerName.includes('alanine') || lowerName.includes('arginine') ||
          lowerName.includes('leucine') || lowerName.includes('lysine') ||
          lowerName.includes('methionine') || lowerName.includes('phenylalanine') ||
          lowerName.includes('threonine') || lowerName.includes('tryptophan') ||
          lowerName.includes('valine') || lowerName.includes('histidine') ||
          lowerName.includes('isoleucine') || lowerName.includes('glycine') ||
          lowerName.includes('serine') || lowerName.includes('proline') ||
          lowerName.includes('cysteine') || lowerName.includes('aspartic') ||
          lowerName.includes('glutamic') || lowerName.includes('tyrosine') ||
          lowerName.includes('asparagine')) return 'Amino Acids';

      return 'Other Nutrients';
    };

    // Organize all nutrients by their category
    nutrientTotals.forEach((nutrient, id) => {
      const category = categorizeByName(nutrient.name);

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push({ id, ...nutrient });
    });

    // Sort nutrients within each category by name
    Object.keys(result).forEach(category => {
      result[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return result;
  }, [nutrientTotals]);

  if (!isOpen || !meal) return null;

  return (
    <div className="fixed inset-0 z-[100015] bg-white dark:bg-neutral-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold">{meal.name}</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto pb-20">
        {loading && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            Loading nutrient data...
          </div>
        )}

        {!loading && nutrientTotals.size === 0 && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            No nutrient data available for this meal.
          </div>
        )}

        {!loading && nutrientTotals.size > 0 && (
          <div className="space-y-8">
            {/* Show all nutrients organized by category */}
            {Object.entries(organizedNutrients).map(([category, nutrients]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300">
                  {category}
                </h2>
                <div className="space-y-3">
                  {nutrients.map((nutrient) => (
                    <div key={nutrient.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {nutrient.name}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {nutrient.amount < 0.01 && nutrient.amount > 0
                          ? "< 0.01"
                          : nutrient.amount < 1
                          ? nutrient.amount.toFixed(2)
                          : Math.round(nutrient.amount)}{" "}
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {nutrient.unit}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
