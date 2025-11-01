import { create } from "zustand";
import type { FoodItem } from "./storageV2";

const STORAGE_KEY = "meal-templates-v1";

export type MealTemplate = {
  id: string;
  name: string;
  items: FoodItem[];
  createdAt: number;
};

type MealTemplatesState = {
  templates: MealTemplate[];
  addTemplate: (name: string, items: FoodItem[]) => MealTemplate;
  removeTemplate: (id: string) => void;
  getTemplate: (id: string) => MealTemplate | undefined;
  loadFromStorage: () => void;
  saveToStorage: () => void;
};

export const useMealTemplatesStore = create<MealTemplatesState>((set, get) => ({
  templates: [],

  addTemplate: (name, items) => {
    const template: MealTemplate = {
      id: Math.random().toString(36).slice(2, 11),
      name,
      items: items.map(item => ({ ...item })), // Deep copy
      createdAt: Date.now(),
    };

    set((state) => ({
      templates: [...state.templates, template],
    }));

    get().saveToStorage();
    return template;
  },

  removeTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }));
    get().saveToStorage();
  },

  getTemplate: (id) => {
    return get().templates.find((t) => t.id === id);
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (Array.isArray(data.templates)) {
        set({ templates: data.templates });
      }
    } catch {
      // Ignore errors
    }
  },

  saveToStorage: () => {
    try {
      const { templates } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ templates }));
    } catch {
      // Ignore errors
    }
  },
}));

// Load from storage on mount
if (typeof window !== "undefined") {
  useMealTemplatesStore.getState().loadFromStorage();
}
