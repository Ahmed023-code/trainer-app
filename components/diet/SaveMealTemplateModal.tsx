"use client";

import { useState } from "react";
import { useMealTemplatesStore } from "@/stores/mealTemplatesStore";
import type { FoodItem } from "@/stores/storageV2";

type SaveMealTemplateModalProps = {
  mealItems: FoodItem[];
  onClose: () => void;
  onSaved?: () => void;
};

export default function SaveMealTemplateModal({ mealItems, onClose, onSaved }: SaveMealTemplateModalProps) {
  const [name, setName] = useState("");
  const addTemplate = useMealTemplatesStore((s) => s.addTemplate);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (mealItems.length === 0) {
      alert("Cannot save an empty meal as a template");
      return;
    }

    addTemplate(name.trim(), mealItems);
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Save as Template</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xl">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Template name input */}
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My High Protein Breakfast"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
              autoFocus
            />
          </div>

          {/* Preview of items */}
          <div>
            <div className="text-sm font-medium mb-2">Items ({mealItems.length})</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {mealItems.map((item, i) => (
                <div key={i} className="text-xs text-neutral-600 dark:text-neutral-400 flex justify-between">
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="ml-2 text-neutral-500">
                    {item.quantity ? `${item.quantity}x` : '1x'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent-diet)] text-white text-sm font-medium hover:opacity-90"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
