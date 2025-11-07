"use client";

import { useEffect, useState, useMemo } from "react";
import { X, ChevronLeft } from "lucide-react";
import { getFoodDetails } from "@/lib/usda-db-v2";
import type { Meal } from "./types";

type Props = {
  isOpen: boolean;
  meals: Meal[];
  goals: { cal: number; p: number; c: number; f: number };
  onClose: () => void;
};

type NutrientData = {
  id: number;
  name: string;
  amount: number;
  unit: string;
  target?: number;
  category: string;
};

// Nutrient targets (daily recommended values)
const NUTRIENT_TARGETS: Record<number, number> = {
  1008: 2400, // Energy (kcal) - will be overridden by user goals
  1003: 180,  // Protein (g) - will be overridden by user goals
  1004: 70,   // Total Fat (g) - will be overridden by user goals
  1005: 240,  // Carbs (g) - will be overridden by user goals
  1079: 30,   // Fiber (g)
  1093: 2300, // Sodium (mg)
  1087: 1000, // Calcium (mg)
  1089: 18,   // Iron (mg)
  1090: 400,  // Magnesium (mg)
  1092: 3500, // Potassium (mg)
  1095: 11,   // Zinc (mg)
  1106: 900,  // Vitamin A (mcg)
  1109: 90,   // Vitamin C (mg)
  1114: 20,   // Vitamin D (mcg)
  1162: 1.7,  // Vitamin B6 (mg)
  1165: 2.4,  // Vitamin B12 (mcg)
  1178: 120,  // Vitamin K (mcg)
  1175: 15,   // Vitamin E (mg)
};

// Time period tabs
type TimePeriod = "today" | "week" | "month" | "3months" | "year";

export default function NutritionOverview({ isOpen, meals, goals, onClose }: Props) {
  const [nutrientTotals, setNutrientTotals] = useState<Map<number, NutrientData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today");
  const [showAllNutrients, setShowAllNutrients] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNutrientTotals(new Map());
      setShowAllNutrients(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const totals = new Map<number, NutrientData>();

      // Load nutrient data for each food item
      for (const meal of meals) {
        for (const item of meal.items) {
          const quantity = item.quantity || 1;

          if (item.fdcId) {
            // Food from USDA database - load detailed nutrients
            try {
              const details = await getFoodDetails(item.fdcId, { cacheReason: 'viewed' });
              if (!details || cancelled) continue;

              const gramsPerUnit = item.gramsPerUnit || 100;
              const totalGrams = quantity * gramsPerUnit;

              // Aggregate nutrients
              for (const nutrient of details.nutrients) {
                const scaledAmount = (nutrient.amount / 100) * totalGrams;

                const existing = totals.get(nutrient.id);
                if (existing) {
                  totals.set(nutrient.id, {
                    ...existing,
                    amount: existing.amount + scaledAmount
                  });
                } else {
                  totals.set(nutrient.id, {
                    id: nutrient.id,
                    name: nutrient.name || `Nutrient ${nutrient.id}`,
                    amount: scaledAmount,
                    unit: nutrient.unit_name || "g",
                    target: NUTRIENT_TARGETS[nutrient.id],
                    category: categorizeNutrient(nutrient.name)
                  });
                }
              }
            } catch (err) {
              console.error(`Error loading nutrients for ${item.name}:`, err);
            }
          } else {
            // Custom food - add basic macros
            const addNutrient = (id: number, amount: number, unit: string, name: string) => {
              if (amount <= 0) return;
              const existing = totals.get(id);
              if (existing) {
                totals.set(id, { ...existing, amount: existing.amount + (amount * quantity) });
              } else {
                totals.set(id, {
                  id,
                  name,
                  amount: amount * quantity,
                  unit,
                  target: NUTRIENT_TARGETS[id],
                  category: categorizeNutrient(name)
                });
              }
            };

            addNutrient(1008, item.calories, 'kcal', 'Energy');
            addNutrient(1003, item.protein, 'g', 'Protein');
            addNutrient(1004, item.fat, 'g', 'Total Fat');
            addNutrient(1005, item.carbs, 'g', 'Carbohydrates');
          }
        }
      }

      // Override macro targets with user goals
      const calorieNutrient = totals.get(1008);
      if (calorieNutrient) {
        totals.set(1008, { ...calorieNutrient, target: goals.cal });
      }
      const proteinNutrient = totals.get(1003);
      if (proteinNutrient) {
        totals.set(1003, { ...proteinNutrient, target: goals.p });
      }
      const fatNutrient = totals.get(1004);
      if (fatNutrient) {
        totals.set(1004, { ...fatNutrient, target: goals.f });
      }
      const carbsNutrient = totals.get(1005);
      if (carbsNutrient) {
        totals.set(1005, { ...carbsNutrient, target: goals.c });
      }

      if (!cancelled) {
        setNutrientTotals(totals);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, meals, goals]);

  // Categorize nutrient by name
  const categorizeNutrient = (name: string): string => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('energy') || lowerName.includes('calorie')) return 'Macronutrients';
    if (lowerName.includes('protein') && !lowerName.includes('alanine')) return 'Macronutrients';
    if (lowerName.includes('carbohydrate') || lowerName.includes('fiber')) return 'Macronutrients';
    if (lowerName === 'total lipid (fat)' || lowerName.includes('total fat')) return 'Macronutrients';

    if (lowerName.includes('saturated') || lowerName.includes('monounsaturated') ||
        lowerName.includes('polyunsaturated') || lowerName.includes('trans fat') ||
        lowerName.includes('omega') || lowerName.includes('cholesterol')) return 'Fats';

    if (lowerName.includes('vitamin')) return 'Vitamins';
    if (lowerName.includes('thiamin') || lowerName.includes('riboflavin') ||
        lowerName.includes('niacin') || lowerName.includes('folate') ||
        lowerName.includes('choline')) return 'Vitamins';

    if (lowerName.includes('calcium') || lowerName.includes('iron') ||
        lowerName.includes('magnesium') || lowerName.includes('phosphorus') ||
        lowerName.includes('potassium') || lowerName.includes('sodium') ||
        lowerName.includes('zinc') || lowerName.includes('copper') ||
        lowerName.includes('manganese') || lowerName.includes('selenium')) return 'Minerals';

    return 'Other';
  };

  // Organize nutrients by category, separating those with and without targets
  const { nutrientsWithTargets, nutrientsWithoutTargets } = useMemo(() => {
    const withTargets: Record<string, NutrientData[]> = {
      'Macronutrients': [],
      'Fats': [],
      'Vitamins': [],
      'Minerals': [],
      'Other': []
    };

    const withoutTargets: Record<string, NutrientData[]> = {
      'Macronutrients': [],
      'Fats': [],
      'Vitamins': [],
      'Minerals': [],
      'Other': []
    };

    nutrientTotals.forEach((nutrient) => {
      const category = nutrient.category;
      const targetList = nutrient.target !== undefined ? withTargets : withoutTargets;

      if (targetList[category]) {
        targetList[category].push(nutrient);
      }
    });

    // Sort nutrients within each category by name
    const sortCategories = (obj: Record<string, NutrientData[]>) => {
      Object.keys(obj).forEach(category => {
        obj[category].sort((a, b) => a.name.localeCompare(b.name));
      });
    };

    sortCategories(withTargets);
    sortCategories(withoutTargets);

    // Remove empty categories
    const removeEmpty = (obj: Record<string, NutrientData[]>) => {
      Object.keys(obj).forEach(key => {
        if (obj[key].length === 0) {
          delete obj[key];
        }
      });
    };

    removeEmpty(withTargets);
    removeEmpty(withoutTargets);

    return {
      nutrientsWithTargets: withTargets,
      nutrientsWithoutTargets: withoutTargets
    };
  }, [nutrientTotals]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100015] bg-white dark:bg-neutral-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Nutrition Overview</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Time period tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {[
            { key: 'today' as TimePeriod, label: 'Today' },
            { key: 'week' as TimePeriod, label: '1 Week' },
            { key: 'month' as TimePeriod, label: '1 Month' },
            { key: '3months' as TimePeriod, label: '3 Months' },
            { key: 'year' as TimePeriod, label: '1 Year' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimePeriod(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                timePeriod === key
                  ? 'bg-accent-diet text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {label}
            </button>
          ))}
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
            No nutrient data available. Add some food to your meals first.
          </div>
        )}

        {!loading && nutrientTotals.size > 0 && (
          <div className="space-y-8">
            {/* Nutrients with targets (progress bars) */}
            {Object.entries(nutrientsWithTargets).map(([category, nutrients]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300">
                  {category}
                </h2>
                <div className="space-y-3">
                  {nutrients.map((nutrient) => {
                    const percentage = nutrient.target
                      ? Math.min((nutrient.amount / nutrient.target) * 100, 100)
                      : 0;
                    const hasTarget = nutrient.target !== undefined;

                    return (
                      <div key={nutrient.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {nutrient.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                              {nutrient.amount < 0.01 && nutrient.amount > 0
                                ? "< 0.01"
                                : nutrient.amount < 1
                                ? nutrient.amount.toFixed(2)
                                : Math.round(nutrient.amount)}{" "}
                              {hasTarget && nutrient.target && (
                                <span className="text-neutral-500 dark:text-neutral-400">
                                  / {Math.round(nutrient.target)}
                                </span>
                              )}
                              {" "}
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {nutrient.unit}
                              </span>
                            </span>
                            {hasTarget && (
                              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 min-w-[40px] text-right">
                                {Math.round(percentage)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {hasTarget && (
                          <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Show More Button */}
            {Object.keys(nutrientsWithoutTargets).length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setShowAllNutrients(!showAllNutrients)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {showAllNutrients ? "Hide Detailed Nutrients" : "Show All Nutrients"}
                </button>
              </div>
            )}

            {/* Detailed nutrients (without targets) */}
            {showAllNutrients && (
              <div className="space-y-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Detailed micronutrient breakdown
                </p>
                {Object.entries(nutrientsWithoutTargets).map(([category, nutrients]) => (
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
        )}
      </div>
    </div>
  );
}
