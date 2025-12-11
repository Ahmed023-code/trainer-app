"use client";

import { useEffect, useMemo, useState } from "react";

export type DesignVariant = "classic" | "glass" | "noir";
const STORAGE_KEY = "demo-design-variant";

export const DESIGN_VARIANTS: Array<{
  id: DesignVariant;
  name: string;
  tagline: string;
}> = [
  { id: "classic", name: "Classic", tagline: "Clean neutral cards" },
  { id: "glass", name: "Glass Aurora", tagline: "Frosted gradients" },
  { id: "noir", name: "Noir Pulse", tagline: "Bold neon edges" },
];

export function useDesignVariant() {
  const [variant, setVariant] = useState<DesignVariant>("classic");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as DesignVariant | null;
    if (stored && DESIGN_VARIANTS.some(v => v.id === stored)) {
      setVariant(stored);
    }
  }, []);

  const update = (next: DesignVariant) => {
    setVariant(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
    }
  };

  return { variant, setVariant: update };
}

export function DesignVariantSwitcher({
  variant,
  onChange,
}: {
  variant: DesignVariant;
  onChange: (variant: DesignVariant) => void;
}) {
  return (
    <div className="fixed inset-x-0 top-3 z-[120] flex justify-center pointer-events-none px-3">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-white">
        <span className="uppercase tracking-wide text-[11px] text-neutral-600 dark:text-neutral-200">
          3 versions mode
        </span>
        <div className="flex flex-wrap gap-1">
      {DESIGN_VARIANTS.map(v => {
        const isActive = v.id === variant;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-[var(--accent-home)] via-[var(--accent-workout)] to-[var(--accent-diet)] text-white shadow-md dark:from-[var(--accent-progress)] dark:via-[var(--accent-workout)] dark:to-[var(--accent-diet)]"
                : "bg-white/60 text-neutral-700 ring-1 ring-black/5 backdrop-blur-sm hover:bg-white dark:bg-neutral-800 dark:text-neutral-100 dark:ring-white/10 dark:hover:bg-neutral-700"
            }`}
          >
            <span>{v.name}</span>
            <span className="hidden text-[11px] font-normal opacity-75 sm:inline">{v.tagline}</span>
          </button>
        );
          })}
        </div>
      </div>
    </div>
  );
}

export function DesignBackdrop({ variant }: { variant: DesignVariant }) {
  const layers = useMemo(() => {
    switch (variant) {
      case "glass":
        return (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-10 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.35),transparent_55%)] blur-3xl" />
            <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.5),transparent_60%)] blur-3xl" />
            <div className="absolute inset-x-10 bottom-[-15%] h-72 rounded-[40%] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.4),transparent_60%)] blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b1020]/70 via-[#0f172a]/70 to-[#020617]/80" />
            <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)]" />
          </div>
        );
      case "noir":
        return (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#05080d] via-[#0c0f20] to-[#050507]" />
            <div className="absolute -left-10 top-10 h-72 w-72 rotate-6 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.5),transparent_60%)] blur-3xl" />
            <div className="absolute right-[-10%] top-1/4 h-72 w-72 -rotate-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.35),transparent_60%)] blur-3xl" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)",
            }} />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.05) 0, transparent 45%)",
            }} />
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]" />
            <div className="absolute inset-0 opacity-60" style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.15) 0, transparent 25%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.2) 0, transparent 30%), radial-gradient(circle at 10% 80%, rgba(99,102,241,0.18) 0, transparent 22%)",
            }} />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
          </div>
        );
    }
  }, [variant]);

  return layers;
}
