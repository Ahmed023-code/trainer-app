"use client";

import { useState } from "react";
import type { Meal } from "@/components/diet/types";
import { saveMealTemplate } from "@/stores/mealTemplates";

type Props = {
  isOpen: boolean;
  meal: Meal | null;
  onClose: () => void;
  onSaved?: () => void;
};

export default function SaveMealModal({ isOpen, meal, onClose, onSaved }: Props) {
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !meal) return null;

  const handleSave = () => {
    const name = templateName.trim() || meal.name;
    if (!name || meal.items.length === 0) return;

    setIsSaving(true);
    try {
      saveMealTemplate(name, meal.items);
      onSaved?.();
      setTemplateName("");
      onClose();
    } catch (error) {
      console.error("Failed to save meal template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTemplateName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9700]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/20 dark:bg-black/40"
        onClick={handleCancel}
        aria-label="Close"
      />

      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 max-w-md w-full">
          <h3 className="font-semibold text-lg mb-4">Save Meal Template</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={meal.name}
                className="w-full rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-diet"
                autoFocus
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Leave blank to use "{meal.name}"
              </p>
            </div>

            <div className="rounded-full border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-800/50">
              <p className="text-sm font-medium mb-1">Foods in this template:</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {meal.items.length} food{meal.items.length === 1 ? "" : "s"}
              </p>
            </div>

            {meal.items.length === 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Cannot save an empty meal. Add foods first.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={meal.items.length === 0 || isSaving}
              className="px-4 py-2 rounded-full bg-accent-diet text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
