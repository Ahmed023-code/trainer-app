"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FoodItem, Meal } from "@/components/diet/types";

type Props = {
  meal: Meal;
  onChange: (updated: Meal) => void;
  onRequestEdit?: (mealName: string, index: number, item: FoodItem) => void;
  onAddFood?: (mealName: string) => void;
};

export default function MealSection({ meal, onChange, onRequestEdit, onAddFood }: Props) {
  // Kebab state + fixed menu coordinates
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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

  return (
    <section className="space-y-3 overflow-visible">
      {/* Header: meal name + compact totals + add button */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-xl">{meal.name}</h2>
        <div className="flex items-center gap-2">
          {onAddFood && (
            <button
              onClick={() => onAddFood(meal.name)}
              className="tap-target min-w-10 min-h-10 flex items-center justify-center rounded-full bg-accent-diet text-white hover:opacity-90 transition-opacity"
              aria-label={`Add food to ${meal.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2 tabular-nums">
          {/* Cal */}
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap"
            style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
          >
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[8px]"
              style={{ backgroundColor: "#34D399", color: "#000" }}
            >
              Cal
            </span>
            <span className="truncate max-w-[20vw]">{totals.calories}</span>
          </span>
          {/* P/F/C */}
          {[
            { label: "P", col: "#F87171", bg: "#F871711F", v: totals.protein },
            { label: "F", col: "#FACC15", bg: "#FACC151F", v: totals.fat },
            { label: "C", col: "#60A5FA", bg: "#60A5FA1F", v: totals.carbs },
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
              <span className="truncate max-w-[16vw]">{v}</span>
            </span>
          ))}
          </div>
        </div>
      </div>

      {/* Foods list; each food in a bubble card */}
      <ul className="space-y-2 overflow-visible">
        {(meal.items || []).map((it, i) => (
          <li
            key={i}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-3 shadow-sm overflow-visible"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: name + chips row */}
              <div className="min-w-0">
                <div className="font-semibold text-lg leading-tight break-words">{it.name}</div>

                <div className="mt-1 flex items-center gap-2 flex-nowrap overflow-x-auto tabular-nums">
                  {/* Cal chip (w-5 h-5 inner circle) */}
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#34D399", backgroundColor: "#34D3991F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#34D399", color: "#000" }}
                    >
                      Cal
                    </span>
                    {(Number(it.calories) || 0) * (Number(it.quantity ?? 1) || 1)}
                  </span>

                  {/* P/F/C smaller chips */}
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#F87171", backgroundColor: "#F871711F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#F87171", color: "#000" }}
                    >
                      P
                    </span>
                    {(Number(it.protein) || 0) * (Number(it.quantity ?? 1) || 1)}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#FACC15", backgroundColor: "#FACC151F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#FACC15", color: "#000" }}
                    >
                      F
                    </span>
                    {(Number(it.fat) || 0) * (Number(it.quantity ?? 1) || 1)}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap"
                    style={{ color: "#60A5FA", backgroundColor: "#60A5FA1F" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full mr-1 leading-none text-center text-[9px]"
                      style={{ backgroundColor: "#60A5FA", color: "#000" }}
                    >
                      C
                    </span>
                    {(Number(it.carbs) || 0) * (Number(it.quantity ?? 1) || 1)}
                  </span>
                </div>
              </div>

              {/* Right: kebab trigger */}
              <div className="shrink-0 self-center ml-3">
                <button
                  ref={setBtnRef(i)}
                  type="button"
                  className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm"
                  onClick={() => openMenu(i)}
                  aria-label="More"
                >
                  ⋯
                </button>
              </div>
            </div>

            {/* Kebab via portal */}
            {openIdx === i &&
              typeof document !== "undefined" &&
              createPortal(
                <>
                  <button className="fixed inset-0 z-[100000]" aria-label="Close" onClick={closeMenu} />
                  <div
                    className="fixed z-[100001] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur p-2 w-36"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <button
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => {
                        onRequestEdit?.(meal.name, i, it);
                        closeMenu();
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="mt-1 block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400"
                      onClick={() => onDeleteFood(i)}
                    >
                      Delete
                    </button>
                  </div>
                </>,
                document.body
              )}
          </li>
        ))}
      </ul>
    </section>
  );
}