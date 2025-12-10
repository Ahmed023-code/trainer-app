/**
 * Meal Templates Storage
 *
 * Allows users to save and load complete meals (with multiple foods) as reusable templates.
 * Uses localStorage for storage with a simple key-value structure.
 */

import type { FoodItem } from "@/components/diet/types";

export type MealTemplate = {
  id: string;
  name: string;
  items: FoodItem[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "meal-templates-v1";

// Helper to read/write JSON from localStorage
const readJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

const writeJSON = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Get all saved meal templates
 */
export const listMealTemplates = (): MealTemplate[] => {
  const templates = readJSON<MealTemplate[]>(STORAGE_KEY, []);
  // Sort by most recently updated
  return templates.sort((a, b) => b.updatedAt - a.updatedAt);
};

/**
 * Get a single meal template by ID
 */
export const getMealTemplate = (id: string): MealTemplate | null => {
  const templates = listMealTemplates();
  return templates.find(t => t.id === id) || null;
};

/**
 * Save a new meal template or update existing one
 */
export const saveMealTemplate = (name: string, items: FoodItem[], id?: string): MealTemplate => {
  const templates = readJSON<MealTemplate[]>(STORAGE_KEY, []);
  const now = Date.now();

  // If ID provided, update existing template
  if (id) {
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = {
        ...templates[index],
        name,
        items: JSON.parse(JSON.stringify(items)), // Deep copy
        updatedAt: now,
      };
      writeJSON(STORAGE_KEY, templates);
      return templates[index];
    }
  }

  // Create new template
  const newTemplate: MealTemplate = {
    id: `template-${now}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    items: JSON.parse(JSON.stringify(items)), // Deep copy
    createdAt: now,
    updatedAt: now,
  };

  templates.push(newTemplate);
  writeJSON(STORAGE_KEY, templates);

  return newTemplate;
};

/**
 * Delete a meal template
 */
export const deleteMealTemplate = (id: string): void => {
  const templates = readJSON<MealTemplate[]>(STORAGE_KEY, []);
  const filtered = templates.filter(t => t.id !== id);
  writeJSON(STORAGE_KEY, filtered);
};

/**
 * Calculate total macros for a meal template
 */
export const calculateTemplateMacros = (template: MealTemplate) => {
  return template.items.reduce((totals, item) => {
    const qty = item.quantity || 1;
    return {
      calories: totals.calories + (item.calories * qty),
      protein: totals.protein + (item.protein * qty),
      fat: totals.fat + (item.fat * qty),
      carbs: totals.carbs + (item.carbs * qty),
    };
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
};
