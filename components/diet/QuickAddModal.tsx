"use client";

import { useState } from "react";
import type { FoodItem } from "@/components/diet/types";

// A simple, reusable modal for quick-adding a food item.
// Not tied to page-level state. Used only if imported by the page.
export default function QuickAddModal({
  meal,
  onClose,
  onSave,
}: {
  meal: string;
  onClose: () => void;
  onSave: (item: FoodItem) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const keepNum = (s: string) => s.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

  const canSave = form.name.trim() !== "";

  function handleSave() {
    if (!canSave) return;
    onSave({
      name: form.name.trim() || "Unnamed",
      quantity: num(form.quantity) || 1,
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
    });
  }

  return (
    <>
      <button className="fixed inset-0 z-[9998]" aria-label="Close" onClick={onClose} />
      <div className="fixed bottom-24 right-6 z-[9999] w-[18rem] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-2xl backdrop-blur p-3 space-y-2">
        <div className="text-lg font-semibold">Quick Add — {meal}</div>
        <label className="block text-sm">Name
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Food name"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">Calories
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              value={form.calories} onChange={(e)=>setForm(f=>({...f, calories: keepNum(e.target.value)}))} placeholder="0" />
          </label>
          <label className="block text-sm">Protein (g)
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              value={form.protein} onChange={(e)=>setForm(f=>({...f, protein: keepNum(e.target.value)}))} placeholder="0" />
          </label>
          <label className="block text-sm">Carbs (g)
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              value={form.carbs} onChange={(e)=>setForm(f=>({...f, carbs: keepNum(e.target.value)}))} placeholder="0" />
          </label>
          <label className="block text-sm">Fat (g)
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              value={form.fat} onChange={(e)=>setForm(f=>({...f, fat: keepNum(e.target.value)}))} placeholder="0" />
          </label>
        </div>

        {/* Quantity steppers */}
        <div className="pt-1">
          <label className="block text-sm mb-1">Quantity</label>
          <div className="flex items-center gap-2 justify-center">
            <button type="button" className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 grid place-items-center text-xl"
              onClick={()=>setForm(f=>({...f, quantity: String(Math.max(0, (Number(f.quantity)||1) - 1))}))}>–</button>
            <input inputMode="decimal" className="w-16 text-center h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 bg-white dark:bg-neutral-900"
              value={form.quantity} onChange={(e)=>setForm(f=>({...f, quantity: keepNum(e.target.value)}))} placeholder="1" />
            <button type="button" className="w-10 h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 grid place-items-center text-xl"
              onClick={()=>setForm(f=>({...f, quantity: String((Number(f.quantity)||1) + 1)}))}>+</button>
          </div>
        </div>

        <div className="pt-1 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded-lg bg-[#34D399] text-black disabled:opacity-50" disabled={!canSave} onClick={handleSave}>Save</button>
        </div>
      </div>
    </>
  );
}