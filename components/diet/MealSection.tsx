"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FoodItem, Meal } from "@/components/diet/types";

type Props = {
  meal: Meal;
  onChange: (updated: Meal) => void;
  onRequestEdit?: (mealName: string, index: number, item: FoodItem) => void;
  onAddFood?: (mealName: string) => void;
  onOpenDetail?: () => void;
  onDelete?: () => void;
};

export default function MealSection({ meal, onChange, onRequestEdit, onAddFood, onOpenDetail, onDelete }: Props) {
  // Collapsed/expanded state for food items
  const [isExpanded, setIsExpanded] = useState(false);

  // Kebab state + fixed menu coordinates
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Deletion confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Stable ref map for kebab buttons
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const setBtnRef = (i: number) => (el: HTMLButtonElement | null) => {
    btnRefs.current[i] = el;
  };

  // Meal totals (tabular-nums, no units)
  const totals = useMemo(() => {
    const sum = (key: keyof FoodItem) =>
      (meal.items || []).reduce((a, it) => a + (Number(it[key]) || 0) * (Number(it.quantity ?? 1) || 1), 0);
    return {
      calories: Math.round(sum("calories")),
      protein: Math.round(sum("protein")),
      fat: Math.round(sum("fat")),
      carbs: Math.round(sum("carbs")),
    };
  }, [meal]);

  function openMenu(i: number) {
    const r = btnRefs.current[i]?.getBoundingClientRect();
    const top = (r?.bottom ?? 0) + 8;
    const left = (r?.right ?? 0) - 144; // ~ menu width
    setPos({ top, left });
    setOpenIdx(i);
  }
  function closeMenu() {
    setOpenIdx(null);
  }

  function onDeleteFood(i: number) {
    const next: Meal = { ...meal, items: (meal.items || []).filter((_, idx) => idx !== i) };
    onChange(next);
    closeMenu();
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <section className="space-y-3 overflow-visible">
      {/* Improved layout: meal name on top, macros below, icons on right */}
      <div className="w-full flex items-start gap-3">
        {/* Left: Meal info (name + macros) */}
        <div className="text-left flex-1 min-w-0">
          {/* Meal name */}
          <h2 className="font-semibold text-base mb-1.5">{meal.name}</h2>

          {/* Macro summary */}
          <div className="flex items-center gap-2 tabular-nums flex-wrap">
            {/* Cal */}
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
              style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
                style={{ backgroundColor: "#34D399", color: "#000" }}
              >
                Cal
              </span>
              {totals.calories}
            </span>
            {/* P/F/C */}
            {[
              { label: "P", col: "#F87171", bg: "#F871711F", v: `${totals.protein}g` },
              { label: "F", col: "#FACC15", bg: "#FACC151F", v: `${totals.fat}g` },
              { label: "C", col: "#60A5FA", bg: "#60A5FA1F", v: `${totals.carbs}g` },
            ].map(({ label, col, bg, v }) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap"
                style={{ color: col, backgroundColor: bg }}
              >
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full mr-1 leading-none text-center text-[8px]"
                  style={{ backgroundColor: col, color: "#000" }}
                >
                  {label}
                </span>
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Chevron, Plus icon and trash icon */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {/* Chevron button for expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all shadow-sm"
            aria-label={isExpanded ? `Collapse ${meal.name}` : `Expand ${meal.name}`}
            aria-expanded={isExpanded}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            >
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {onAddFood && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddFood(meal.name);
              }}
              className="tap-target w-9 h-9 flex items-center justify-center rounded-full bg-accent-diet text-white hover:opacity-90 transition-opacity shadow-sm"
              aria-label={`Add food to ${meal.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
              className="tap-target w-9 h-9 flex items-center justify-center rounded-full border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shadow-sm"
              aria-label={`Delete ${meal.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M2 4h12M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v9.5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded food items */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        {meal.items && meal.items.length > 0 ? (
          <div className="space-y-2">
            {meal.items.map((item, idx) => {
              const qty = Number(item.quantity ?? 1) || 1;
              const displayCal = Math.round((Number(item.calories) || 0) * qty);
              const displayP = Math.round((Number(item.protein) || 0) * qty);
              const displayF = Math.round((Number(item.fat) || 0) * qty);
              const displayC = Math.round((Number(item.carbs) || 0) * qty);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-full bg-white/50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-700/50"
                >
                  {/* Left: Food name with quantity and macros */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate mb-1">
                      {item.name} <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">({qty} {item.unit || 'serving'}{qty !== 1 ? 's' : ''})</span>
                    </h3>
                    {/* Macros on single line */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
                      >
                        {displayCal}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: "#F87171", backgroundColor: "#F871711F" }}
                      >
                        {displayP}g
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
                      >
                        {displayF}g
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
                      >
                        {displayC}g
                      </span>
                    </div>
                  </div>

                  {/* Right: 3-dot menu */}
                  <button
                    ref={setBtnRef(idx)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openMenu(idx);
                    }}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label={`Food options for ${item.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                      <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-neutral-400 dark:text-neutral-500">
            No foods added yet
          </div>
        )}
      </div>

      {/* Food item context menu */}
      {openIdx !== null && typeof document !== "undefined" && createPortal(
        <>
          <button
            className="fixed inset-0 z-[9996]"
            onClick={closeMenu}
            aria-label="Close menu"
          />
          <div
            className="fixed z-[9997] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              onClick={() => {
                if (onRequestEdit) {
                  onRequestEdit(meal.name, openIdx, meal.items[openIdx]);
                }
                closeMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Edit Food
            </button>
            <button
              onClick={() => onDeleteFood(openIdx)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Delete Food
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <button
            className="fixed inset-0 z-[9998] bg-black/20 dark:bg-black/40"
            onClick={cancelDelete}
            aria-label="Cancel"
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 max-w-sm w-full">
              <h3 className="font-semibold text-lg mb-2">Delete Meal?</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Are you sure you want to delete "{meal.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </section>
  );
}