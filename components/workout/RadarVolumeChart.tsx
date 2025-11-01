"use client";

import React, { useMemo } from "react";

type Props = {
  data: Record<string, number>; // keys must match axis order below
  maxRings?: number;            // default 5
};

const AXES = [
  "Quads",
  "Glutes",
  "Hamstrings",
  "Calves",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
] as const;

export default function RadarVolumeChart({ data, maxRings = 5 }: Props) {
  // geometry constants (keep SVG and math aligned)
  const cx = 160;
  const cy = 160;
  const rGrid = 120;

  const { points, total } = useMemo(() => {
    const vals = AXES.map((k) => Math.max(0, Number(data?.[k] ?? 0)));
    const maxVal = Math.max(1, ...vals); // avoid divide-by-zero
    const total = vals.reduce((a, b) => a + b, 0);
    const step = (2 * Math.PI) / AXES.length;

    const toXY = (i: number, v: number) => {
      const angle = -Math.PI / 2 + i * step; // start at top
      const rr = (v / maxVal) * rGrid;
      return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
    };
    const pts = vals.map((v, i) => toXY(i, v));
    return { points: pts, total };
  }, [data]);

  const poly = points.map(([x, y]) => `${x},${y}`).join(" ");
  const rings = Array.from({ length: maxRings }, (_, i) => (i + 1) / maxRings);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Muscle Volume Today</h3>
        <div className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
          Total {Math.round(total)} lbs
        </div>
      </div>

      {total <= 0 ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-10">
          No volume yet — log sets to see chart.
        </div>
      ) : (
        <div className="mt-2 grid place-items-center">
          <svg width="360" height="360" viewBox="0 0 320 320" className="text-neutral-300 dark:text-neutral-700">
            {/* grid rings */}
            {rings.map((f, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={rGrid * f}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            ))}
            {/* axes */}
            {AXES.map((_, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
              const x = cx + rGrid * Math.cos(angle);
              const y = cy + rGrid * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              );
            })}
            {/* polygon */}
            <polygon
              points={poly}
              fill="var(--accent-workout)"
              fillOpacity="0.4"
              stroke="var(--accent-workout)"
              strokeWidth="2"
            />
            {/* vertices */}
            {points.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="var(--accent-workout)" />
            ))}

            {/* labels — pushed out slightly and smaller to avoid clipping */}
            {AXES.map((label, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
              const lx = cx + 148 * Math.cos(angle);
              const ly = cy + 148 * Math.sin(angle);
              const ax = Math.cos(angle);
              const anchor = ax > 0.25 ? "start" : ax < -0.25 ? "end" : "middle";
              const dy =
                Math.sin(angle) > 0.25 ? "1.0em" :
                Math.sin(angle) < -0.25 ? "-0.6em" : "0.35em";
              return (
                <text
                  key={label}
                  x={lx}
                  y={ly}
                  textAnchor={anchor as any}
                  className="fill-neutral-600 dark:fill-neutral-300 text-[10px] leading-none"
                  dy={dy}
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}