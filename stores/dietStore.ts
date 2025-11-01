"use client";

import { create } from "zustand";

export type MealItem = { id: string; meal: string; name: string; p: number; c: number; f: number; cals: number };
type DietState = {
  dateISO: string;
  meals: MealItem[];
  addFood: (meal: string) => void;
  copyFrom: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };

export const useDietStore = create<DietState>((set, get) => ({
  dateISO: todayISO(),
  meals: [],
  addFood: (meal) => {
    const item = { id: uid(), meal, name: "Chicken 150g", p: 35, c: 0, f: 4, cals: 200 };
    set({ meals: [...get().meals, item] });
  },
  copyFrom: () => {
    const src = get().meals;
    const copy = src.map(m => ({ ...m, id: uid() }));
    set({ meals: [...get().meals, ...copy] });
  }
}));
