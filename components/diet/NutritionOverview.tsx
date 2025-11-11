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

// Nutrient colors matching MacroRings
const NUTRIENT_COLORS: Record<number, string> = {
  1008: '#34D399', // Calories - green
  1003: '#F87171', // Protein - red/pink
  1005: '#60A5FA', // Carbs - blue
  1004: '#FACC15', // Fat - yellow
  1079: '#60A5FA', // Fiber - blue (same as carbs)
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

      // First, calculate simple macro totals (to match MacroRings display)
      let simpleMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const meal of meals) {
        for (const item of meal.items) {
          const quantity = item.quantity || 1;
          simpleMacros.calories += (item.calories || 0) * quantity;
          simpleMacros.protein += (item.protein || 0) * quantity;
          simpleMacros.carbs += (item.carbs || 0) * quantity;
          simpleMacros.fat += (item.fat || 0) * quantity;
        }
      }

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

              // Aggregate nutrients (but skip main macros - we'll use simple totals for those)
              for (const nutrient of details.nutrients) {
                // Skip main macros - we'll set them from simple totals
                if ([1008, 1003, 1004, 1005].includes(nutrient.id)) continue;

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
            // Custom food - nutrients already counted in simpleMacros
          }
        }
      }

      // Set main macros from simple totals (to match MacroRings)
      totals.set(1008, {
        id: 1008,
        name: 'Calories',
        amount: simpleMacros.calories,
        unit: 'kcal',
        target: goals.cal,
        category: 'Macronutrients'
      });
      totals.set(1003, {
        id: 1003,
        name: 'Protein',
        amount: simpleMacros.protein,
        unit: 'g',
        target: goals.p,
        category: 'Macronutrients'
      });
      totals.set(1004, {
        id: 1004,
        name: 'Total Fat',
        amount: simpleMacros.fat,
        unit: 'g',
        target: goals.f,
        category: 'Macronutrients'
      });
      totals.set(1005, {
        id: 1005,
        name: 'Total Carbohydrates',
        amount: simpleMacros.carbs,
        unit: 'g',
        target: goals.c,
        category: 'Macronutrients'
      });

      // Add Net Carbs (Total Carbs - Fiber)
      const totalCarbs = totals.get(1005);
      const fiber = totals.get(1079);
      if (totalCarbs && fiber) {
        const netCarbsAmount = Math.max(0, totalCarbs.amount - fiber.amount);
        // Use a synthetic ID for Net Carbs
        totals.set(9999, {
          id: 9999,
          name: 'Net Carbohydrates',
          amount: netCarbsAmount,
          unit: 'g',
          target: undefined, // No target for net carbs
          category: 'Macronutrients'
        });
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
      // Special case: Net Carbohydrates (id: 9999) should appear in main section even without target
      const targetList = (nutrient.target !== undefined || nutrient.id === 9999) ? withTargets : withoutTargets;

      if (targetList[category]) {
        targetList[category].push(nutrient);
      }
    });

    // Custom sort order for macronutrients with targets
    const macroSortOrder: Record<number, number> = {
      1008: 1, // Calories
      1003: 2, // Protein
      1005: 3, // Total Carbs
      1079: 4, // Fiber
      9999: 5, // Net Carbs
      1004: 6, // Fat
    };

    // Sort nutrients within each category
    const sortCategories = (obj: Record<string, NutrientData[]>) => {
      Object.keys(obj).forEach(category => {
        if (category === 'Macronutrients') {
          // Custom sort for macros
          obj[category].sort((a, b) => {
            const orderA = macroSortOrder[a.id] || 999;
            const orderB = macroSortOrder[b.id] || 999;
            return orderA - orderB;
          });
        } else {
          // Alphabetical sort for other categories
          obj[category].sort((a, b) => a.name.localeCompare(b.name));
        }
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

        {/* Time period tabs - optimized for narrow screens */}
        <div className="flex gap-1.5 px-4 pb-3">
          {[
            { key: 'today' as TimePeriod, label: 'Today' },
            { key: 'week' as TimePeriod, label: 'Week' },
            { key: 'month' as TimePeriod, label: 'Month' },
            { key: '3months' as TimePeriod, label: '3M' },
            { key: 'year' as TimePeriod, label: 'Year' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimePeriod(key)}
              className={`flex-1 px-2 py-2 rounded-full text-xs font-medium transition-colors ${
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
                    const isComplete = hasTarget && nutrient.target && nutrient.amount >= nutrient.target;
                    const difference = hasTarget && nutrient.target
                      ? nutrient.amount - nutrient.target
                      : 0;
                    const formattedDifference = Math.abs(difference) < 1
                      ? Math.abs(difference).toFixed(1)
                      : Math.round(Math.abs(difference));

                    return (
                      <div key={nutrient.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {nutrient.name}
                            </span>
                            {isComplete && (
                              <span className="text-green-500 text-base leading-none">✓</span>
                            )}
                          </div>
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
                            {hasTarget && !isComplete && difference !== 0 && (
                              <span className={`text-xs font-medium min-w-[60px] text-right ${
                                difference > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'
                              }`}>
                                {difference > 0 ? '+' : '-'}{formattedDifference} {difference > 0 ? 'over' : 'under'}
                              </span>
                            )}
                          </div>
                        </div>
                        {hasTarget && (
                          <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: NUTRIENT_COLORS[nutrient.id] || '#1f00ff'
                              }}
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
                  className="w-full px-4 py-3 rounded-full border-2 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium text-neutral-700 dark:text-neutral-300"
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
