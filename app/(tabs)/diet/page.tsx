"use client";

import { useEffect, useMemo, useState } from "react";
import MacroRings from "@/components/diet/MacroRings";
import MealSection from "@/components/diet/MealSection";
import FoodLibraryModal from "@/components/diet/FoodLibraryModal";
import DaySelector from "@/components/ui/DaySelector";
import { useDaySelector } from "@/hooks/useDaySelector";
import { readDiet, writeDiet } from "@/stores/storageV2";
import type { Meal, FoodItem } from "@/components/diet/types";

// Small icon masker so SVGs inherit currentColor
function IconMask({ src, size = 18, className = "" }: { src: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

// Icons for second-level actions
const optionIcons: Record<string, string> = {
  "Quick Add": "/icons/fi-sr-plus-small.svg",
  Search: "/icons/fi-sr-search.svg",
};

const DEFAULT_MEALS: Meal[] = [
  { name: "Breakfast", items: [] },
  { name: "Lunch", items: [] },
  { name: "Dinner", items: [] },
  { name: "Snacks", items: [] },
];

type Goals = { cal: number; p: number; c: number; f: number };

export default function DietPage() {
  // Date selector
  const { dateISO, dateObj, goPrevDay, goNextDay, setDateISO, isToday } = useDaySelector("ui-last-date-diet");
  
  // goals
  const [goals, setGoals] = useState<Goals>({ cal: 2400, p: 180, c: 240, f: 70 });

  // meals
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);

  // Add key for transition effect on date change
  const [contentKey, setContentKey] = useState(0);

  // FAB state
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showMealOptions, setShowMealOptions] = useState<null | { meal: string }>(null);

  // Quick Add / Edit shared bubble state
  const [showForm, setShowForm] = useState<null | { meal: string }>(null);
  const [editTarget, setEditTarget] = useState<null | { meal: string; index: number }>(null);
  const [form, setForm] = useState<{ name: string; calories: string; protein: string; carbs: string; fat: string; quantity: string }>({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    quantity: "1",
  });

  // Search modal
  const [showLibraryFor, setShowLibraryFor] = useState<null | { meal: string }>(null);

  // Load data for selected date
  useEffect(() => {
    const state = readDiet(dateISO);
    if (state.goals) setGoals(state.goals);
    if (state.meals && state.meals.length > 0) setMeals(state.meals);
    setContentKey((k) => k + 1); // Trigger transition
  }, [dateISO]);

  // Persist meals
  useEffect(() => {
    writeDiet(dateISO, { meals, goals });
  }, [meals, goals, dateISO]);

  // CHANGE: Memoize totals with dateISO to prevent stale data across date changes
  // totals for day
  const totals = useMemo(() => {
    const sum = (key: "calories" | "protein" | "carbs" | "fat") =>
      meals.reduce((a, meal) => {
        const mealSum = (meal.items || []).reduce((x, it) => {
          const qty = Number(it.quantity ?? 1) || 1;
          const val = Number((it as any)[key] ?? 0) || 0;
          return x + val * qty;
        }, 0);
        return a + mealSum;
      }, 0);

    return {
      calories: sum("calories"),
      protein: sum("protein"),
      carbs: sum("carbs"),
      fat: sum("fat"),
    };
  }, [meals, dateISO]);

  // helpers for quantity parsing in the inline form
  const parseQty = (s: string) => {
    const v = Number((s ?? "").toString());
    return isFinite(v) ? v : 0;
  };
  const clampQty = (v: number) => Math.max(0, v);
  const incQty = (step = 1) => {
    setForm((f) => ({ ...f, quantity: String(clampQty(parseQty(f.quantity ?? "0") + step)) }));
  };
  const decQty = (step = 1) => {
    setForm((f) => ({ ...f, quantity: String(clampQty(parseQty(f.quantity ?? "0") - step)) }));
  };

  // open Quick Add bubble
  function openForm(mealName: string) {
    setEditTarget(null);
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", quantity: "1" });
    setShowMealOptions(null);
    setShowFabMenu(false);
    setShowForm({ meal: mealName });
  }

  // open Edit bubble
  function openEditForm(mealName: string, index: number, item: FoodItem) {
    setEditTarget({ meal: mealName, index });
    setForm({
      name: item.name ?? "",
      calories: String(item.calories ?? 0),
      protein: String(item.protein ?? 0),
      carbs: String(item.carbs ?? 0),
      fat: String(item.fat ?? 0),
      quantity: String(item.quantity ?? 1),
    });
    setShowMealOptions(null);
    setShowFabMenu(false);
    setShowForm({ meal: mealName });
  }

  // save Quick Add / Edit
  function saveForm() {
    if (!showForm) return;
    const idxMeal = meals.findIndex((m) => m.name.toLowerCase() === showForm.meal.toLowerCase());
    if (idxMeal === -1) return;

    const name = form.name.trim() || "Unnamed";
    const quantity = Number(form.quantity) || 1;
    const cal = Number(form.calories) || 0;
    const p = Number(form.protein) || 0;
    const c = Number(form.carbs) || 0;
    const f = Number(form.fat) || 0;

    setMeals((prev) => {
      const next = [...prev];
      const items = [...(next[idxMeal].items || [])];
      const newItem: FoodItem = { name, quantity, calories: cal, protein: p, carbs: c, fat: f };

      if (editTarget && editTarget.meal.toLowerCase() === showForm.meal.toLowerCase()) {
        items[editTarget.index] = { ...items[editTarget.index], ...newItem };
      } else {
        items.push(newItem);
      }

      next[idxMeal] = { ...next[idxMeal], items };
      return next;
    });

    setShowForm(null);
    setEditTarget(null);
  }

  // add from library
  function addPickedToMeal(mealName: string, picked: FoodItem) {
    const idxMeal = meals.findIndex((m) => m.name.toLowerCase() === mealName.toLowerCase());
    if (idxMeal === -1) return;
    setMeals((prev) => {
      const next = [...prev];
      const items = [...(next[idxMeal].items || [])];
      items.push({
        name: picked.name,
        quantity: picked.quantity ?? 1,
        calories: Number(picked.calories ?? 0),
        protein: Number(picked.protein ?? 0),
        carbs: Number(picked.carbs ?? 0),
        fat: Number(picked.fat ?? 0),
      });
      next[idxMeal] = { ...next[idxMeal], items };
      return next;
    });
  }

  // CHANGE: Added responsive container with max-width and safe-area support
  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <header className="pt-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1">
            <DaySelector
              dateISO={dateISO}
              dateObj={dateObj}
              onPrev={goPrevDay}
              onNext={goNextDay}
              onSelect={setDateISO}
              isToday={isToday}
            />
          </div>
          <a
            href={`/settings/diet?returnDate=${dateISO}`}
            className="tap-target min-w-10 min-h-10 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium bg-accent-diet text-white hover:opacity-90 transition-opacity"
            aria-label="Edit Diet Goals"
          >
            <img src="/icons/fi-sr-settings.svg" alt="" className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* CHANGE: Removed key from wrapper to prevent duplicate ring mounting on date change */}
      {/* Rings under header */}
      <div className="mt-3 flex justify-center transition-all duration-150">
        <MacroRings
          calories={{ label: "Cal", color: "var(--accent-diet)", current: Math.round(totals.calories), target: goals.cal }}
          protein={{ label: "P",   color: "#F87171", current: Math.round(totals.protein),  target: goals.p }}
          fat={{     label: "F",   color: "var(--accent-diet-fat)", current: Math.round(totals.fat),      target: goals.f }}
          carbs={{   label: "C",   color: "#60A5FA", current: Math.round(totals.carbs),    target: goals.c }}
        />
      </div>

      {/* Meals list in page-level bubbles */}
      <section key={contentKey} className="space-y-6 relative z-0 overflow-visible mt-4 transition-all duration-150">
        {meals.map((meal, i) => (
          <div
            key={meal.name}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm overflow-visible"
          >
            <MealSection
              meal={meal}
              onChange={(updated) => {
                const next = [...meals];
                next[i] = updated;
                setMeals(next);
              }}
              onRequestEdit={(mealName, index, item) => openEditForm(mealName, index, item)}
              onAddFood={(mealName) => {
                setShowLibraryFor({ meal: mealName });
              }}
            />
          </div>
        ))}
        {meals.every(m => m.items.length === 0) && (
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-16">
            No entries for {dateISO}. Tap the + to add a meal.
          </div>
        )}
      </section>

      {/* FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        {/* Main FAB */}
        <button
          className="w-14 h-14 rounded-full bg-accent-diet text-black shadow-lg grid place-items-center text-4xl leading-none"
          onClick={() => {
            setShowFabMenu((v) => !v);
            setShowMealOptions(null);
          }}
          aria-label="Add"
        >
          +
        </button>

        {/* First-level meal picker */}
        {showFabMenu && (
          <>
            <button
              className="fixed inset-0 z-[9498]"
              aria-label="Close"
              onClick={() => {
                setShowFabMenu(false);
                setShowMealOptions(null);
              }}
            />
            <div className="absolute right-0 bottom-20 z-[9499] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-2 w-44">
              {["Breakfast", "Lunch", "Dinner", "Snacks"].map((m) => (
                <button
                  key={m}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => {
                    setShowFabMenu(false);
                    setShowMealOptions({ meal: m });
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Second-level options with icons */}
        {showMealOptions && (
          <>
            <button
              className="fixed inset-0 z-[9498]"
              aria-label="Close"
              onClick={() => setShowMealOptions(null)}
            />
            <div className="absolute right-0 bottom-20 z-[9499] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-2 w-48">
              {["Quick Add", "Search"].map((label) => (
                <button
                  key={label}
                  className="flex w-full items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => {
                    if (label === "Back") {
                      setShowMealOptions(null);
                      return;
                    }
                    if (label === "Quick Add") {
                      openForm(showMealOptions.meal);
                      return;
                    }
                    if (label === "Search") {
                      setShowLibraryFor({ meal: showMealOptions.meal });
                      setShowFabMenu(false);
                      setShowMealOptions(null);
                    }
                  }}
                >
                  {optionIcons[label] && (
                    <IconMask src={optionIcons[label]} className="text-neutral-700 dark:text-neutral-200" />
                  )}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick Add / Edit bubble */}
      {showForm && (
        <>
          <button
            className="fixed inset-0 z-[9998]"
            aria-label="Close"
            onClick={() => {
              setShowForm(null);
              setEditTarget(null);
            }}
          />
          <div className="fixed right-6 bottom-24 z-[9999] w-[min(560px,calc(100vw-2rem))]">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {editTarget ? `Edit • ${showForm.meal}` : `Quick Add • ${showForm.meal}`}
                </div>
                <button
                  className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700"
                  onClick={() => {
                    setShowForm(null);
                    setEditTarget(null);
                  }}
                >
                  Close
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm col-span-2">
                  Name
                  <input
                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>

                <label className="text-sm">
                  Calories
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={form.calories}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        calories: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Protein
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={form.protein}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        protein: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Carbs
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={form.carbs}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        carbs: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Fat
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
                    value={form.fat}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        fat: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                  />
                </label>
              </div>

              {/* Quantity control at end of form */}
              <div className="pt-3">
                <label className="block text-sm mb-1">Quantity</label>
                <div className="flex items-center gap-2 justify-center">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 grid place-items-center text-xl"
                    onClick={() => decQty(1)}
                    aria-label="Decrease quantity"
                  >
                    –
                  </button>

                  <input
                    inputMode="decimal"
                    className="w-20 text-center h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 bg-white dark:bg-neutral-900"
                    value={form.quantity ?? "1"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantity: e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                      }))
                    }
                    placeholder="1"
                  />

                  <button
                    type="button"
                    className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 grid place-items-center text-xl"
                    onClick={() => incQty(1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700"
                  onClick={() => {
                    setShowForm(null);
                    setEditTarget(null);
                  }}
                >
                  Cancel
                </button>
                <button className="px-3 py-2 rounded-lg bg-accent-diet text-black" onClick={saveForm}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Food library search */}
      <FoodLibraryModal
        isOpen={!!showLibraryFor}
        onClose={() => setShowLibraryFor(null)}
        onPick={(item) => {
          if (!showLibraryFor) return;
          addPickedToMeal(showLibraryFor.meal, item);
          setShowLibraryFor(null);
        }}
      />
    </main>
  );
}