"use client";

import { useEffect, useState } from "react";
import type { FoodItem } from "@/stores/storageV2";

// Simple edit modal. Not required by the page if editing is done via the inline bubble,
// but kept to satisfy any imports and to compile cleanly.
export function EditFoodModal({
  food,
  onClose,
  onSave,
}: {
  food: FoodItem;
  onClose: () => void;
  onSave: (v: FoodItem) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    setForm({
      name: food.name ?? "",
      quantity: String(food.quantity ?? 1),
      calories: String(food.calories ?? 0),
      protein: String(food.protein ?? 0),
      carbs: String(food.carbs ?? 0),
      fat: String(food.fat ?? 0),
    });
  }, [food]);

  const keepNum = (s: string) => s.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
  const canSave = form.name.trim() !== "";

  return (
    <div className="fixed inset-0 z-[100010] grid place-items-end sm:place-items-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4" onClick={(e)=>e.stopPropagation()}>
        <h3 className="font-medium mb-3">Edit food</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm">Name
            <input className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900" value={form.name} onChange={(e)=>setForm(f=>({...f, name: e.target.value}))} />
          </label>
          <label className="text-sm">Calories
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900" value={form.calories} onChange={(e)=>setForm(f=>({...f, calories: keepNum(e.target.value)}))} />
          </label>
          <label className="text-sm">Protein
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900" value={form.protein} onChange={(e)=>setForm(f=>({...f, protein: keepNum(e.target.value)}))} />
          </label>
          <label className="text-sm">Carbs
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900" value={form.carbs} onChange={(e)=>setForm(f=>({...f, carbs: keepNum(e.target.value)}))} />
          </label>
          <label className="text-sm">Fat
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900" value={form.fat} onChange={(e)=>setForm(f=>({...f, fat: keepNum(e.target.value)}))} />
          </label>
          <label className="text-sm">Quantity
            <input inputMode="decimal" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900" value={form.quantity} onChange={(e)=>setForm(f=>({...f, quantity: keepNum(e.target.value)}))} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded-lg bg-[#34D399] text-black disabled:opacity-50" disabled={!canSave}
            onClick={()=>onSave({
              name: form.name.trim() || "Unnamed",
              quantity: Number(form.quantity) || 1,
              calories: num(form.calories),
              protein: num(form.protein),
              carbs: num(form.carbs),
              fat: num(form.fat),
            })}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}