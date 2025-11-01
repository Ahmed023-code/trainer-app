"use client";

export type FoodItem = {
  name: string;
  quantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = {
  name: string;
  items: FoodItem[];
};