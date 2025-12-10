"use client";

export type FoodItem = {
  name: string;
  quantity?: number;
  unit?: string; // e.g., "g", "oz", "cup", "serving"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Optional USDA metadata for re-editing with full database features
  fdcId?: number;
  // Store the grams value for the current quantity (for recalculating portions)
  gramsPerUnit?: number;
};

export type Meal = {
  name: string;
  items: FoodItem[];
};