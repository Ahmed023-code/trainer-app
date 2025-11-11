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
  const pct = Math.max(0, Math.min(1, target > 0 ? current / target : 0));
  const dash = circumference * pct;

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

  // For calorie ring, create multi-colored segments based on macro ratios
  const renderCalorieRing = () => {
    if (!protein || !fat || !carbs) return null;

    const totalCals = protein.current * 4 + carbs.current * 4 + fat.current * 9;
    const targetCals = target;

    // Calculate proportions based on current consumption
    const proteinCals = protein.current * 4;
    const carbsCals = carbs.current * 4;
    const fatCals = fat.current * 9;

    // Calculate percentages of the ring
    const proteinPct = totalCals > 0 ? proteinCals / totalCals : 0.33;
    const fatPct = totalCals > 0 ? fatCals / totalCals : 0.33;
    const carbsPct = totalCals > 0 ? carbsCals / totalCals : 0.34;

    // Calculate how much of the circle to fill based on goal (can exceed 100%)
    const fillPct = targetCals > 0 ? totalCals / targetCals : 0;
    const totalFill = circumference * Math.min(fillPct, 1.5); // Cap at 150% visually

    // Calculate dash lengths for each segment
    const proteinDash = totalFill * proteinPct;
    const fatDash = totalFill * fatPct;
    const carbsDash = totalFill * carbsPct;

    // Check which macros are over their targets
    const proteinOver = protein.current > protein.target;
    const fatOver = fat.current > fat.target;
    const carbsOver = carbs.current > carbs.target;

    return (
      <>
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
        {/* Protein segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={proteinOver ? "#C64444" : "#F87171"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={proteinOver ? `2 2` : `${proteinDash} ${circumference - proteinDash}`}
          strokeDashoffset="0"
          fill="none"
          opacity={proteinOver ? "0.8" : "1"}
          style={proteinOver ? { strokeDasharray: `${proteinDash} ${circumference - proteinDash}`, stroke: "url(#protein-pattern)" } : {}}
        />
        {/* Fat segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fatOver ? "#C9A000" : "#FACC15"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${fatDash} ${circumference - fatDash}`}
          strokeDashoffset={-proteinDash}
          fill="none"
          opacity={fatOver ? "0.8" : "1"}
        />
        {/* Carbs segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={carbsOver ? "#3D7BC7" : "#60A5FA"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${carbsDash} ${circumference - carbsDash}`}
          strokeDashoffset={-(proteinDash + fatDash)}
          fill="none"
          opacity={carbsOver ? "0.8" : "1"}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-w-0 shrink">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 rotate-[-90deg] w-full h-full">
          {/* Define stripe pattern for overage */}
          <defs>
            <pattern id={`stripe-${label}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
              <rect width="2" height="4" fill={color} opacity="0.4" />
            </pattern>
          </defs>

          {label === "Cal" ? renderCalorieRing() : (
            <>
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
              {current > target ? (
                <>
                  {/* Base darker color */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={label === "P" ? "#C64444" : label === "F" ? "#C9A000" : "#3D7BC7"}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(dash, circumference * 1.5)} ${circumference - Math.min(dash, circumference * 1.5)}`}
                    fill="none"
                    opacity="0.8"
                  />
                  {/* Diagonal stripe overlay */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#stripe-${label})`}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(dash, circumference * 1.5)} ${circumference - Math.min(dash, circumference * 1.5)}`}
                    fill="none"
                  />
                </>
              ) : (
                <>
                  {/* Progress up to target */}
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
                </>
              )}
            </>
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
