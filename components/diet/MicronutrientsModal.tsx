'use client';

import { X } from 'lucide-react';
import type { USDANutrient } from '@/lib/usda-db-v2';

interface MicronutrientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodName: string;
  nutrients: USDANutrient[];
  servingGrams: number; // The serving size in grams
}

export default function MicronutrientsModal({
  isOpen,
  onClose,
  foodName,
  nutrients,
  servingGrams
}: MicronutrientsModalProps) {
  if (!isOpen) return null;

  // Scale nutrients from per-100g to the actual serving size
  const scaledNutrients = nutrients.map(n => ({
    ...n,
    amount: (n.amount * servingGrams) / 100
  }));

  // Group nutrients by category (using scaled nutrients)
  const macros = scaledNutrients.filter(n =>
    ['Protein', 'Total lipid (fat)', 'Carbohydrate, by difference', 'Energy'].includes(n.name)
  );

  const vitamins = scaledNutrients.filter(n =>
    n.name.includes('Vitamin') || n.name.includes('vitamin')
  );

  const minerals = scaledNutrients.filter(n =>
    ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium'].includes(n.name)
  );

  const fattyAcids = scaledNutrients.filter(n =>
    n.name.includes('fatty acids') || n.name.includes('Cholesterol')
  );

  const other = scaledNutrients.filter(n =>
    !macros.includes(n) && !vitamins.includes(n) && !minerals.includes(n) && !fattyAcids.includes(n)
  );

  const renderNutrientGroup = (title: string, nutrients: USDANutrient[]) => {
    if (nutrients.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          {title}
        </h3>
        <div className="space-y-2">
          {nutrients.map((nutrient, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {nutrient.name}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {nutrient.amount.toFixed(2)} {nutrient.unit_name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nutrition Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
              {foodName}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Per {Math.round(servingGrams)}g serving
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {scaledNutrients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No nutrition data available for this food.
              </p>
            </div>
          ) : (
            <>
              {renderNutrientGroup('Macronutrients', macros)}
              {renderNutrientGroup('Vitamins', vitamins)}
              {renderNutrientGroup('Minerals', minerals)}
              {renderNutrientGroup('Fats & Cholesterol', fattyAcids)}
              {renderNutrientGroup('Other Nutrients', other)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Data from USDA FoodData Central
          </p>
        </div>
      </div>
    </div>
  );
}
