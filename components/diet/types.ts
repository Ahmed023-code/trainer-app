"use client";

export type FoodItem = {
  name: string;
  quantity?: number;
  unit?: string; // e.g., "g", "oz", "cup", "serving"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = {
  name: string;
  items: FoodItem[];
};