"use client";

import { useState, useMemo } from "react";
import { useMealTemplatesStore } from "@/stores/mealTemplatesStore";
import type { MealTemplate } from "@/stores/mealTemplatesStore";
import type { FoodItem } from "@/stores/storageV2";

type LoadMealTemplateModalProps = {
  onClose: () => void;
  onLoad: (items: FoodItem[]) => void;
};

export default function LoadMealTemplateModal({ onClose, onLoad }: LoadMealTemplateModalProps) {
  const templates = useMealTemplatesStore((s) => s.templates);
  const removeTemplate = useMealTemplatesStore((s) => s.removeTemplate);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(query));
  }, [templates, searchQuery]);

  const handleLoad = (template: MealTemplate) => {
    onLoad(template.items);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this template?")) {
      removeTemplate(id);
    }
  };

  const getTotalMacros = (items: FoodItem[]) => {
    return items.reduce(
      (acc, item) => ({
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        calories: acc.calories + item.calories,
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Load from Template</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xl">
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
          />
        </div>

        {/* Templates list */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center text-sm text-neutral-500 py-8">
              {searchQuery ? "No templates found" : "No templates saved yet"}
            </div>
          ) : (
            filteredTemplates.map((template) => {
              const macros = getTotalMacros(template.items);
              return (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  onClick={() => handleLoad(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{template.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {template.items.length} item{template.items.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(template.id, e)}
                      className="ml-2 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Macros preview */}
                  <div className="flex gap-3 text-xs">
                    <div>
                      <span className="text-neutral-500">P:</span> <span className="font-medium">{Math.round(macros.protein)}g</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">C:</span> <span className="font-medium">{Math.round(macros.carbs)}g</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">F:</span> <span className="font-medium">{Math.round(macros.fat)}g</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Cal:</span> <span className="font-medium">{Math.round(macros.calories)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Close button */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
