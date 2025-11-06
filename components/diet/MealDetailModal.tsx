"use client";

import { useState, useEffect } from "react";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import MealNutrientsModal from "./MealNutrientsModal";
import { Info } from "lucide-react";
import type { Meal, FoodItem } from "@/components/diet/types";

type Props = {
  isOpen: boolean;
  meal: Meal | null;
  onClose: () => void;
  onChange: (next: Meal) => void;
  onRequestEdit?: (index: number, item: FoodItem) => void;
  onAddFood?: () => void;
  onSaveTemplate?: () => void;
  onLoadTemplate?: () => void;
};

export default function MealDetailModal({
  isOpen,
  meal,
  onClose,
  onChange,
  onRequestEdit,
  onAddFood,
  onSaveTemplate,
  onLoadTemplate,
}: Props) {
  // Local state to track changes before saving
  const [localMeal, setLocalMeal] = useState<Meal | null>(null);
  // Track if meal name is being edited
  const [isEditingName, setIsEditingName] = useState(false);
  // Track if showing meal nutrients modal
  const [showNutrients, setShowNutrients] = useState(false);

  // Initialize local state when modal opens or meal changes
  useEffect(() => {
    if (isOpen && meal) {
      setLocalMeal(JSON.parse(JSON.stringify(meal))); // Deep copy
    }
  }, [isOpen, meal]);

  // Drag and drop for food items
  const {
    draggedIndex: draggedFoodIndex,
    dragOverIndex: dragOverFoodIndex,
    handleDragStart: handleFoodDragStart,
    handleDragEnd: handleFoodDragEnd,
    handleDragOver: handleFoodDragOver,
    handleDragEnter: handleFoodDragEnter,
    handleDragLeave: handleFoodDragLeave,
    handleDrop: handleFoodDrop,
  } = useDragAndDrop(
    localMeal?.items || [],
    (newItems) => {
      if (localMeal) {
        const updatedMeal = { ...localMeal, items: newItems };
        setLocalMeal(updatedMeal);
        // Immediately persist the reorder
        onChange(updatedMeal);
      }
    }
  );

  if (!isOpen || !localMeal) return null;

  const deleteFood = (idx: number) => {
    const next = { ...localMeal, items: localMeal.items.filter((_, i) => i !== idx) };
    setLocalMeal(next);
    // Immediately persist the deletion
    onChange(next);
  };

  const handleCancel = () => {
    // Restore original meal state when canceling
    if (meal) {
      onChange(meal);
    }
    onClose();
  };

  const handleSave = () => {
    onChange(localMeal);
    onClose();
  };

  // Calculate totals
  const totals = {
    calories: Math.round(localMeal.items.reduce((sum, item) => sum + (item.calories * (item.quantity || 1)), 0)),
    protein: Math.round(localMeal.items.reduce((sum, item) => sum + (item.protein * (item.quantity || 1)), 0)),
    fat: Math.round(localMeal.items.reduce((sum, item) => sum + (item.fat * (item.quantity || 1)), 0)),
    carbs: Math.round(localMeal.items.reduce((sum, item) => sum + (item.carbs * (item.quantity || 1)), 0)),
  };

  return (
    <div className="fixed inset-0 z-[9600]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-sm"
        aria-label="Close"
        onClick={handleCancel}
      />

      {/* Modal content */}
      <div className="absolute inset-0 bg-white dark:bg-neutral-900 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 p-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
          {/* Meal name and info */}
          <div>
            {isEditingName ? (
              <input
                type="text"
                value={localMeal.name}
                onChange={(e) => setLocalMeal({ ...localMeal, name: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="font-semibold text-lg bg-transparent border-b-2 border-accent-diet focus:outline-none w-full"
              />
            ) : (
              <h2
                className="font-semibold text-lg cursor-pointer hover:text-accent-diet transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {localMeal.name}
              </h2>
            )}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {localMeal.items.length} food{localMeal.items.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Meal totals */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                style={{ backgroundColor: "#34D399", color: "#000" }}
              >
                Cal
              </span>
              {totals.calories}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ color: "#F87171", backgroundColor: "#F871711F" }}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                style={{ backgroundColor: "#F87171", color: "#000" }}
              >
                P
              </span>
              {totals.protein}g
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                style={{ backgroundColor: "#FACC15", color: "#000" }}
              >
                F
              </span>
              {totals.fat}g
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap"
              style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                style={{ backgroundColor: "#60A5FA", color: "#000" }}
              >
                C
              </span>
              {totals.carbs}g
            </span>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {/* Details button - show nutrient breakdown */}
            {localMeal.items.length > 0 && localMeal.items.some(item => item.fdcId) && (
              <button
                onClick={() => setShowNutrients(true)}
                className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                aria-label="View all nutrients"
              >
                <Info className="w-4 h-4" />
                Details
              </button>
            )}
            {onAddFood && (
              <button
                onClick={onAddFood}
                className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Add food"
              >
                + Add Food
              </button>
            )}
            {onLoadTemplate && (
              <button
                onClick={onLoadTemplate}
                className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Load meal template"
              >
                Load Meal
              </button>
            )}
            {onSaveTemplate && localMeal.items.length > 0 && (
              <button
                onClick={onSaveTemplate}
                className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Save meal template"
              >
                Save as Template
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
          {localMeal.items.length === 0 ? (
            <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-16">
              No foods in this meal yet.
            </div>
          ) : (
            localMeal.items.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={handleFoodDragStart(i)}
                onDragEnd={handleFoodDragEnd}
                onDragOver={handleFoodDragOver}
                onDragEnter={handleFoodDragEnter(i)}
                onDragLeave={handleFoodDragLeave}
                onDrop={handleFoodDrop(i)}
                className={`rounded-xl border p-4 cursor-move transition-all ${
                  draggedFoodIndex === i
                    ? 'opacity-50 border-accent-diet'
                    : dragOverFoodIndex === i
                    ? 'border-accent-diet border-2 scale-[1.02]'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  {/* Food name and quantity with unit */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base leading-tight break-words">
                      {item.name}
                    </h3>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {item.quantity || 1} serving{(item.quantity || 1) !== 1 ? 's' : ''}{item.unit || item.gramsPerUnit ? `: ${item.unit || `${item.gramsPerUnit}g`}` : ''}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {onRequestEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestEdit(i, item);
                        }}
                        className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFood(i);
                      }}
                      className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Macros chips */}
                <div className="flex items-center gap-2 flex-wrap">
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
                    {Math.round((item.calories) * (item.quantity || 1))}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#F87171", backgroundColor: "#F871711F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#F87171", color: "#000" }}
                    >
                      P
                    </span>
                    {Math.round((item.protein) * (item.quantity || 1))}g
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#FACC15", color: "#000" }}
                    >
                      F
                    </span>
                    {Math.round((item.fat) * (item.quantity || 1))}g
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#60A5FA", color: "#000" }}
                    >
                      C
                    </span>
                    {Math.round((item.carbs) * (item.quantity || 1))}g
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fixed Footer with Save/Cancel */}
        <div className="sticky bottom-0 z-20 p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
          <button
            className="flex-1 px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-3 rounded-full bg-accent-diet text-black font-medium hover:opacity-90 transition-opacity"
            onClick={handleSave}
          >
            Save
          </button>
        </div>

        {/* FAB - Add Food */}
        {onAddFood && (
          <div className="absolute right-6 bottom-24 z-10">
            <button
              className="w-14 h-14 rounded-full bg-accent-diet text-black shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={onAddFood}
              aria-label="Add food"
            >
              <span className="text-4xl leading-none" style={{ marginTop: '-2px' }}>+</span>
            </button>
          </div>
        )}
      </div>

      {/* Meal Nutrients Modal */}
      <MealNutrientsModal
        isOpen={showNutrients}
        meal={localMeal}
        onClose={() => setShowNutrients(false)}
      />
    </div>
  );
}
