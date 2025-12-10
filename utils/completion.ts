// CHANGE: New utility to check if a day is "complete" (workout + weight + diet logged)
import { readDiet, readWorkout, readWeight } from "@/stores/storageV2";

export function isDayComplete(dateISO: string): boolean {
  // Check workout: at least 1 exercise with sets
  const workout = readWorkout(dateISO);
  const hasWorkout = workout.exercises.some((ex) => ex.sets.length > 0);

  // Check weight: numeric entry exists
  const weight = readWeight(dateISO);
  const hasWeight = weight !== null && weight > 0;

  // Check diet: at least 1 meal item or calories > 0
  const diet = readDiet(dateISO);
  const hasDiet = diet.meals.some((meal) => meal.items.length > 0);

  return hasWorkout && hasWeight && hasDiet;
}

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
