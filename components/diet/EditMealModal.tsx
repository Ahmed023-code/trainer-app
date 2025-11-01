"use client";
import { useState } from "react";

export function EditMealModal({
  meal, onClose, onSave,
}: {
  meal: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}) {
  const [name, setName] = useState(String(meal));
  const valid = name.trim().length > 0;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 p-3" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4" onClick={(e)=>e.stopPropagation()}>
        <h3 className="font-medium mb-3">Edit meal</h3>
        <label className="text-sm block">Meal name
          <input className="input mt-1" value={name} onChange={(e)=>setName(e.target.value)} />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-accent-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-accent" disabled={!valid} onClick={() => valid && onSave(name.trim())}>Save</button>
        </div>
      </div>
    </div>
  );
}