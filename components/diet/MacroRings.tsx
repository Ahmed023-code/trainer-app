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
  onDietDetailsClick,
  onDietSettingsClick,
}: {
  calories: RingProps;
  protein: RingProps;
  fat: RingProps;
  carbs: RingProps;
  onDietDetailsClick?: () => void;
  onDietSettingsClick?: () => void;
}) {
  // Force re-render when props change by tracking them in state
  const [rings, setRings] = useState([calories, protein, fat, carbs]);

  useEffect(() => {
    console.log('[MacroRings] Props changed:', { calories, protein, fat, carbs });
    setRings([calories, protein, fat, carbs]);
  }, [calories.target, protein.target, fat.target, carbs.target, calories.current, protein.current, fat.current, carbs.current]);

  return (
    <div className="rounded-3xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800 bg-white/10 dark:bg-neutral-900/30 backdrop-blur shadow-inner w-full">
      <div className="flex items-center gap-2 sm:gap-4 justify-around">
        {rings.map((r) => (
          <Ring key={`${r.label}-${r.target}`} {...r} protein={protein} fat={fat} carbs={carbs} />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onDietDetailsClick}
          className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Diet Details
        </button>
        <button
          onClick={onDietSettingsClick}
          className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Diet Settings
        </button>
      </div>
    </div>
  );
}

function Ring({ label, current, target, color, protein, fat, carbs }: RingProps & { protein?: RingProps; fat?: RingProps; carbs?: RingProps }) {
  const size = 62;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Allow ring to go beyond 100%, cap at 150% for visual display
  const pct = Math.max(0, Math.min(1.5, target > 0 ? current / target : 0));
  const dash = circumference * pct;
  // Track if we're at or below 100%
  const normalPct = Math.min(1, target > 0 ? current / target : 0);
  const normalDash = circumference * normalPct;

  // Calculate difference
  const diff = current - target;
  const isOver = diff > 0;
  const isUnder = diff < 0;

  console.log(`[Ring ${label}] Rendering with current=${current}, target=${target}`);

  // Get background color based on label
  const getBgColor = () => {
    switch (label) {
      case "Cal":
        return "#34D3991F";
      case "P":
        return "#F871711F";
      case "F":
        return "#FACC151F";
      case "C":
        return "#60A5FA1F";
      default:
        return `${color}22`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-w-0 shrink">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 rotate-[-90deg] w-full h-full">
          {/* Define stripe pattern for overage - unique per ring */}
          <defs>
            <pattern
              id={`stripe-${label}-${current}-${target}`}
              patternUnits="userSpaceOnUse"
              width="4"
              height="4"
              patternTransform="rotate(45)"
            >
              <rect width="2" height="4" fill="currentColor" className="text-white dark:text-black" opacity="0.5" />
            </pattern>
          </defs>

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
          {/* Base progress ring - shows up to 100% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${normalDash} ${circumference - normalDash}`}
            fill="none"
            style={{ transition: 'stroke-dasharray 0.3s ease-in-out' }}
          />
          {/* Overage portion - shows amount beyond 100% with darker color and stripes */}
          {current > target && (
            <g className="overflow-layer">
              {/* Darker base layer - shows the portion over 100% */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={label === "Cal" ? "#1F9D6D" : label === "P" ? "#B84444" : label === "F" ? "#C9A000" : "#3D7BC7"}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${circumference - (dash - normalDash)}`}
                strokeDashoffset={-normalDash}
                fill="none"
                style={{ transition: 'stroke-dasharray 0.3s ease-in-out, stroke-dashoffset 0.3s ease-in-out' }}
              />
              {/* Diagonal stripe pattern overlay */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#stripe-${label}-${current}-${target})`}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${circumference - (dash - normalDash)}`}
                strokeDashoffset={-normalDash}
                fill="none"
                opacity="0.6"
                style={{ transition: 'stroke-dasharray 0.3s ease-in-out, stroke-dashoffset 0.3s ease-in-out' }}
              />
            </g>
          )}
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
      <div className="mt-1.5 flex flex-col items-center gap-1">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold tabular-nums whitespace-nowrap"
          style={{
            backgroundColor: getBgColor(),
            color: color
          }}
        >
          {Math.round(current)}/{Math.round(target)}
        </span>
        {/* Difference indicator */}
        {diff !== 0 && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold gap-0.5"
            style={{
              backgroundColor: color,
              color: '#000'
            }}
          >
            {isOver ? '↑' : '↓'} {Math.abs(Math.round(diff))}{label === 'Cal' ? 'cal' : 'g'}
          </span>
        )}
      </div>
    </div>
  );
}
