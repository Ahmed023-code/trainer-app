"use client";

import { useEffect, useState } from "react";

type RingProps = {
  label: "Cal" | "P" | "F" | "C";
  current: number;
  target: number;
  color: string; // hex
};

export default function MacroRings({
  calories,
  protein,
  fat,
  carbs,
  onMenuClick,
}: {
  calories: RingProps;
  protein: RingProps;
  fat: RingProps;
  carbs: RingProps;
  onMenuClick?: () => void;
}) {
  // Force re-render when props change by tracking them in state
  const [rings, setRings] = useState([calories, protein, fat, carbs]);

  useEffect(() => {
    console.log('[MacroRings] Props changed:', { calories, protein, fat, carbs });
    setRings([calories, protein, fat, carbs]);
  }, [calories.target, protein.target, fat.target, carbs.target, calories.current, protein.current, fat.current, carbs.current]);

  return (
    <button
      onClick={onMenuClick}
      className="rounded-3xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800 bg-white/10 dark:bg-neutral-900/30 backdrop-blur shadow-inner relative transition-colors hover:bg-white/15 dark:hover:bg-neutral-900/40 cursor-pointer w-full"
      aria-label="Open diet menu"
    >
      <div className="flex items-center gap-2 sm:gap-4 justify-around">
        {rings.map((r) => (
          <Ring key={`${r.label}-${r.target}`} {...r} />
        ))}
      </div>
    </button>
  );
}

function Ring({ label, current, target, color }: RingProps) {
  const size = 62; // diameter - reduced for better fit
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, target > 0 ? current / target : 0));
  const dash = circumference * pct;

  console.log(`[Ring ${label}] Rendering with current=${current}, target=${target}`);

  // Get background color based on label
  const getBgColor = () => {
    switch (label) {
      case "Cal":
        return "#34D3991F"; // Green with transparency
      case "P":
        return "#F871711F"; // Red with transparency
      case "F":
        return "#FACC151F"; // Yellow with transparency
      case "C":
        return "#60A5FA1F"; // Blue with transparency
      default:
        return `${color}22`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-w-0 shrink">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 rotate-[-90deg] w-full h-full">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth={stroke}
            fill="none"
            className="text-neutral-400 dark:text-neutral-600"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            fill="none"
          />
        </svg>

        {/* Center label as colored circle with black text */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="inline-grid place-items-center rounded-full font-extrabold text-[10px] leading-none"
            style={{ width: 22, height: 22, backgroundColor: color, color: "#000" }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Value bubble under ring */}
      <div className="mt-1.5">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold tabular-nums whitespace-nowrap"
          style={{
            backgroundColor: getBgColor(),
            color: color
          }}
        >
          {Math.round(current)}/{Math.round(target)}
        </span>
      </div>
    </div>
  );
}
