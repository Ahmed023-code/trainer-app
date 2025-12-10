"use client";

import { useState, useEffect } from "react";
import { listMealTemplates, deleteMealTemplate, calculateTemplateMacros, type MealTemplate } from "@/stores/mealTemplates";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (template: MealTemplate) => void;
};

export default function LoadMealModal({ isOpen, onClose, onLoad }: Props) {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      setTemplates(listMealTemplates());
      setSelectedId(null);
    }
  }, [isOpen]);

  const handleLoad = (template: MealTemplate) => {
    onLoad(template);
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteMealTemplate(id);
    setTemplates(listMealTemplates());
    setShowDeleteConfirm(null);
  };

  if (!isOpen) return null;

  const selectedTemplate = selectedId ? templates.find(t => t.id === selectedId) : null;

  return (
    <div className="fixed inset-0 z-[9700]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/20 dark:bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-lg">Load Meal Template</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Select a saved meal to load into the current meal
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {templates.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400 mb-2">No saved meal templates yet</p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  Create a meal with foods, then save it as a template
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => {
                  const macros = calculateTemplateMacros(template);
                  const isSelected = selectedId === template.id;

                  return (
                    <div
                      key={template.id}
                      className={`rounded-full border p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-accent-diet bg-accent-diet/5"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-accent-diet/50"
                      }`}
                      onClick={() => setSelectedId(template.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base">{template.name}</h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {template.items.length} food{template.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(template.id);
                          }}
                          className="px-2 py-1 text-xs rounded-full border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Macros */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                          style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                            style={{ backgroundColor: "#34D399", color: "#000" }}
                          >
                            Cal
                          </span>
                          {Math.round(macros.calories)}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                          style={{ color: "#F87171", backgroundColor: "#F871711F" }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                            style={{ backgroundColor: "#F87171", color: "#000" }}
                          >
                            P
                          </span>
                          {Math.round(macros.protein)}g
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                          style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                            style={{ backgroundColor: "#FACC15", color: "#000" }}
                          >
                            F
                          </span>
                          {Math.round(macros.fat)}g
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                          style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
                        >
                          <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                            style={{ backgroundColor: "#60A5FA", color: "#000" }}
                          >
                            C
                          </span>
                          {Math.round(macros.carbs)}g
                        </span>
                      </div>

                      {/* Preview foods */}
                      {isSelected && template.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Foods:</p>
                          <ul className="space-y-1">
                            {template.items.map((item, idx) => (
                              <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-400">
                                • {item.name} {item.quantity && item.quantity !== 1 ? `(${item.quantity}${item.unit ? ` ${item.unit}` : ""})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTemplate && handleLoad(selectedTemplate)}
              disabled={!selectedTemplate}
              className="px-4 py-2 rounded-full bg-accent-diet text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Template
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9800] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteConfirm(null)}
            aria-label="Cancel"
          />
          <div className="bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 max-w-sm w-full relative z-10">
            <h3 className="font-semibold text-lg mb-2">Delete Template?</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete this meal template? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
