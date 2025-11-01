"use client";
import { useRef, useState } from "react";

export function SwipeDelete({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const [dx, setDx] = useState(0);
  const startX = useRef(0);

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <button className="absolute right-0 top-0 h-full w-16 bg-red-500 text-white text-xs" onClick={onDelete}>
        Delete
      </button>
      <div
        className="relative bg-white dark:bg-neutral-900 px-3 py-2 touch-pan-y"
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
        onTouchMove={(e) => {
          const v = e.touches[0].clientX - startX.current;
          setDx(Math.min(0, Math.max(-64, v)));
        }}
        onTouchEnd={() => { if (dx < -48) setDx(-64); else setDx(0); }}
      >
        {children}
      </div>
    </div>
  );
}