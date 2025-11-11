"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import MacroRings from "@/components/diet/MacroRings";
import MealSection from "@/components/diet/MealSection";
import MealDetailModal from "@/components/diet/MealDetailModal";
import FoodLibraryModal from "@/components/diet/FoodLibraryModal";
import EditFoodModal from "@/components/diet/EditFoodModal";
import SaveMealModal from "@/components/diet/SaveMealModal";
import LoadMealModal from "@/components/diet/LoadMealModal";
import NutritionOverview from "@/components/diet/NutritionOverview";
import DaySelector from "@/components/ui/DaySelector";
import { useDaySelector } from "@/hooks/useDaySelector";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { readDiet, writeDiet, getTodayISO } from "@/stores/storageV2";
import type { Meal, FoodItem } from "@/components/diet/types";
import type { MealTemplate } from "@/stores/mealTemplates";

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

  // Go to Today function
  const goToToday = () => {
    const today = getTodayISO();
    setDateISO(today);
    localStorage.setItem("ui-last-date-diet", today);
  };

  // Track if we're loading data to prevent circular updates
  const isLoadingRef = useRef(false);

  // goals with logging
  const [goals, setGoalsInternal] = useState<Goals>({ cal: 2400, p: 180, c: 240, f: 70 });

  const setGoals = (newGoals: Goals) => {
    console.log('[Diet] setGoals called with:', newGoals);
    setGoalsInternal(newGoals);
  };

  // meals
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS);

  // Add key for transition effect on date change
  const [contentKey, setContentKey] = useState(0);

  // FAB state - removed meal selection states since we skip that step now
  // const [showFabMenu, setShowFabMenu] = useState(false);
  // const [showMealOptions, setShowMealOptions] = useState<null | { meal: string }>(null);

  // Unified edit food state - replaces old Quick Add bubble for editing
  const [editFood, setEditFood] = useState<null | { mealIndex: number; foodIndex: number; item: FoodItem }>(null);

  // Search modal
  const [showLibraryFor, setShowLibraryFor] = useState<null | { meal: string }>(null);

  // Meal detail modal
  const [showMealDetail, setShowMealDetail] = useState<null | { mealIndex: number }>(null);

  // Meal template modals
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);

  // Nutrition overview page
  const [showNutritionOverview, setShowNutritionOverview] = useState(false);

  // Track if bubble was triggered from Log Meal button - no longer needed
  // const [bubbleSource, setBubbleSource] = useState<"fab" | "button">("fab");
  // const logMealButtonRef = useRef<HTMLButtonElement>(null);

  // Drag and drop for meals
  const {
    draggedIndex: draggedMealIndex,
    dragOverIndex: dragOverMealIndex,
    handleDragStart: handleMealDragStart,
    handleDragEnd: handleMealDragEnd,
    handleDragOver: handleMealDragOver,
    handleDragEnter: handleMealDragEnter,
    handleDragLeave: handleMealDragLeave,
    handleDrop: handleMealDrop,
  } = useDragAndDrop(meals, setMeals);

  // Load data for selected date and reload on visibility/focus/storage changes
  useEffect(() => {
    const loadData = () => {
      isLoadingRef.current = true;
      const state = readDiet(dateISO);
      if (state.goals) setGoals(state.goals);
      if (state.meals && state.meals.length > 0) setMeals(state.meals);
      setContentKey((k) => k + 1); // Trigger transition
      // Reset loading flag after a brief delay to allow state updates to settle
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    };

    loadData();

    // Reload goals when:
    // 1. Page becomes visible (switching back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const state = readDiet(dateISO);
        if (state.goals) setGoals(state.goals);
      }
    };

    // 2. Window gains focus (navigating back from settings)
    const handleFocus = () => {
      const state = readDiet(dateISO);
      if (state.goals) setGoals(state.goals);
    };

    // 3. Storage changes (when diet goals are updated in settings)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "diet-by-day-v2" || e.key === null) {
        const state = readDiet(dateISO);
        if (state.goals) setGoals(state.goals);
      }
    };

    // 4. Custom event from updateDietGoals (same tab/window updates)
    const handleDietGoalsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[Diet] dietGoalsUpdated event received:', customEvent.detail);
      if (customEvent.detail?.dateISO === dateISO) {
        console.log('[Diet] Updating goals to:', customEvent.detail.goals);
        setGoals(customEvent.detail.goals);
        setContentKey((k) => k + 1); // Force re-render of MacroRings
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("dietGoalsUpdated", handleDietGoalsUpdated);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("dietGoalsUpdated", handleDietGoalsUpdated);
    };
  }, [dateISO]);

  // Log goals changes
  useEffect(() => {
    console.log('[Diet] Goals state changed to:', goals);
  }, [goals]);

  // Persist meals only (NOT goals - goals are persisted via updateDietGoals from settings)
  // This prevents infinite loops where persisting goals triggers events that update goals again
  useEffect(() => {
    if (isLoadingRef.current) {
      console.log('[Diet] Skipping persist during load');
      return;
    }
    console.log('[Diet] Persisting meals to localStorage:', { dateISO, meals: meals.length });
    writeDiet(dateISO, { meals });
  }, [meals, dateISO]);

  // Escape key handler for edit food modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editFood) {
        setEditFood(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editFood]);

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

  // Save edited food with updated quantity
  function saveEditFood(updatedItem: FoodItem) {
    if (!editFood) return;

    setMeals((prev) => {
      const next = [...prev];
      const items = [...(next[editFood.mealIndex].items || [])];
      items[editFood.foodIndex] = updatedItem;
      next[editFood.mealIndex] = { ...next[editFood.mealIndex], items };
      return next;
    });

    setEditFood(null);
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

  // Auto-generate meal name based on count
  function generateMealName(): string {
    const existingCount = meals.filter(m => m.items.length > 0).length;
    return `Meal ${existingCount + 1}`;
  }

  // Create new meal and open detail modal
  function createNewMeal() {
    const newMeal: Meal = {
      name: generateMealName(),
      items: []
    };

    setMeals(prev => [...prev, newMeal]);

    // Open detail modal for the newly created meal
    setTimeout(() => {
      setShowMealDetail({ mealIndex: meals.length });
    }, 0);
  }

  // CHANGE: Added responsive container with max-width and safe-area support
  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <header className="pt-4 space-y-3">
        {/* Date selector with full-width Today button */}
        <DaySelector
          dateISO={dateISO}
          dateObj={dateObj}
          onPrev={goPrevDay}
          onNext={goNextDay}
          onSelect={setDateISO}
          isToday={isToday}
          onGoToToday={goToToday}
          accentColor="var(--accent-diet)"
          fullWidthLayout={true}
        />
      </header>

      {/* Rings under header with action buttons */}
      <div className="mt-3 flex justify-center transition-all duration-150">
        <MacroRings
          key={`${goals.cal}-${goals.p}-${goals.c}-${goals.f}`}
          calories={{ label: "Cal", color: "var(--accent-diet)", current: Math.round(totals.calories), target: goals.cal }}
          protein={{ label: "P",   color: "#F87171", current: Math.round(totals.protein),  target: goals.p }}
          fat={{     label: "F",   color: "#FACC15", current: Math.round(totals.fat),      target: goals.f }}
          carbs={{   label: "C",   color: "#60A5FA", current: Math.round(totals.carbs),    target: goals.c }}
          onDietDetailsClick={() => setShowNutritionOverview(true)}
          onDietSettingsClick={() => window.location.href = `/settings/diet?returnDate=${dateISO}`}
        />
      </div>

      {/* Meals list in page-level bubbles */}
      <section key={contentKey} className="space-y-6 relative z-0 overflow-visible mt-4 transition-all duration-150">
        {meals.filter(meal => meal.items.length > 0).map((meal, i) => {
          // Get the original index in the full meals array
          const originalIndex = meals.findIndex(m => m.name === meal.name);
          return (
            <div
              key={meal.name}
              draggable
              onDragStart={handleMealDragStart(originalIndex)}
              onDragEnd={handleMealDragEnd}
              onDragOver={handleMealDragOver}
              onDragEnter={handleMealDragEnter(originalIndex)}
              onDragLeave={handleMealDragLeave}
              onDrop={handleMealDrop(originalIndex)}
              className={`rounded-xl border backdrop-blur p-4 shadow-sm overflow-visible cursor-move hover:shadow-md transition-all ${
                draggedMealIndex === originalIndex
                  ? 'opacity-50 border-accent-diet'
                  : dragOverMealIndex === originalIndex
                  ? 'border-accent-diet border-2 scale-[1.02]'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60'
              }`}
              onClick={(e) => {
                // Prevent opening detail during drag
                if (draggedMealIndex !== null) return;
                setShowMealDetail({ mealIndex: originalIndex });
              }}
            >
              <MealSection
                meal={meal}
                onChange={(updated) => {
                  const next = [...meals];
                  next[originalIndex] = updated;
                  setMeals(next);
                }}
                onRequestEdit={(mealName, index, item) => {
                  setEditFood({ mealIndex: originalIndex, foodIndex: index, item });
                }}
                onAddFood={(mealName) => {
                  setShowLibraryFor({ meal: mealName });
                }}
                onOpenDetail={() => {
                  setShowMealDetail({ mealIndex: originalIndex });
                }}
                onDelete={() => {
                  const next = meals.filter(m => m.name !== meal.name);
                  setMeals(next);
                }}
              />
            </div>
          );
        })}

        {/* Log Meal button always visible */}
        <div className="flex items-center justify-center pt-4">
          <button
            onClick={createNewMeal}
            className="px-8 py-3 rounded-full text-base font-medium border-2 bg-transparent transition-all hover:bg-opacity-5"
            style={{ borderColor: "var(--accent-diet)", color: "var(--accent-diet)", backgroundColor: "transparent" }}
          >
            + Log Meal
          </button>
        </div>
      </section>

      {/* FAB - simplified to create new meal directly */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button
          className="w-14 h-14 rounded-full bg-accent-diet text-black shadow-lg flex items-center justify-center"
          onClick={createNewMeal}
          aria-label="Add meal"
        >
          <span className="text-4xl leading-none" style={{ marginTop: '-2px' }}>+</span>
        </button>
      </div>

      {/* Edit Food Modal - with full USDA features (servings/weight, portions, micronutrients) */}
      {editFood && (
        <EditFoodModal
          isOpen={true}
          foodItem={editFood.item}
          onClose={() => setEditFood(null)}
          onSave={(updatedItem) => saveEditFood(updatedItem)}
        />
      )}

      {/* Food library search */}
      <FoodLibraryModal
        isOpen={!!showLibraryFor}
        onClose={() => setShowLibraryFor(null)}
        onPick={(item) => {
          if (!showLibraryFor) return;

          // If meal detail is open, add food directly to that meal
          if (showMealDetail) {
            const next = [...meals];
            // Create a new meal object to trigger React re-render
            next[showMealDetail.mealIndex] = {
              ...next[showMealDetail.mealIndex],
              items: [...next[showMealDetail.mealIndex].items, item]
            };
            setMeals(next);
          } else {
            // Otherwise use the old flow for adding to meals from main view
            addPickedToMeal(showLibraryFor.meal, item);
          }

          setShowLibraryFor(null);
        }}
      />

      {/* Meal detail modal */}
      <MealDetailModal
        isOpen={!!showMealDetail}
        meal={showMealDetail ? meals[showMealDetail.mealIndex] : null}
        onClose={() => setShowMealDetail(null)}
        onChange={(updated) => {
          if (!showMealDetail) return;
          const next = [...meals];
          next[showMealDetail.mealIndex] = updated;
          setMeals(next);
        }}
        onRequestEdit={(index, item) => {
          if (!showMealDetail) return;
          // Don't close modal, open edit in place
          setEditFood({ mealIndex: showMealDetail.mealIndex, foodIndex: index, item });
        }}
        onAddFood={() => {
          if (!showMealDetail) return;
          const mealName = meals[showMealDetail.mealIndex].name;
          setShowLibraryFor({ meal: mealName });
        }}
        onSaveTemplate={() => {
          setShowSaveTemplate(true);
        }}
        onLoadTemplate={() => {
          setShowLoadTemplate(true);
        }}
      />

      {/* Save meal template modal */}
      <SaveMealModal
        isOpen={showSaveTemplate}
        meal={showMealDetail ? meals[showMealDetail.mealIndex] : null}
        onClose={() => setShowSaveTemplate(false)}
        onSaved={() => {
          setShowSaveTemplate(false);
        }}
      />

      {/* Load meal template modal */}
      <LoadMealModal
        isOpen={showLoadTemplate}
        onClose={() => setShowLoadTemplate(false)}
        onLoad={(template: MealTemplate) => {
          if (!showMealDetail) return;
          const next = [...meals];

          // Create a new meal object to trigger React re-render
          next[showMealDetail.mealIndex] = {
            ...next[showMealDetail.mealIndex],
            items: [...next[showMealDetail.mealIndex].items, ...template.items]
          };
          setMeals(next);
          setShowLoadTemplate(false);
        }}
      />

      {/* Nutrition overview page */}
      <NutritionOverview
        isOpen={showNutritionOverview}
        meals={meals}
        goals={goals}
        onClose={() => setShowNutritionOverview(false)}
      />
    </main>
  );
}