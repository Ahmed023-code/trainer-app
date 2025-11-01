"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { readWorkout, toISODate } from "@/stores/storageV2";

type Props = {
  dateISO: string;
  counts: Record<string, number>; // muscle -> set count for today
  onBarClick?: (muscle: string) => void;
};

const MUSCLE_ORDER = [
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

// SVG path for rounded rect
const roundedRectPath = (x: number, y: number, w: number, h: number, r: number): string => {
  return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y} Z`;
};

// Generate sparkline path
const sparklinePath = (points: number[], width: number, height: number, padding: number): string => {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const x = padding + width / 2;
    const y = padding + height / 2;
    return `M${x},${y} L${x},${y}`;
  }

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const stepX = width / (points.length - 1);

  const coords = points.map((val, i) => {
    const x = padding + i * stepX;
    const y = padding + height - ((val - minVal) / range) * height;
    return { x, y };
  });

  let path = `M${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    path += ` L${coords[i].x},${coords[i].y}`;
  }

  return path;
};

// Generate filled area path for sparkline
const sparklineAreaPath = (points: number[], width: number, height: number, padding: number): string => {
  if (points.length === 0) return "";

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const stepX = width / (points.length - 1);

  const coords = points.map((val, i) => {
    const x = padding + i * stepX;
    const y = padding + height - ((val - minVal) / range) * height;
    return { x, y };
  });

  let path = `M${padding},${padding + height}`;
  path += ` L${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    path += ` L${coords[i].x},${coords[i].y}`;
  }
  path += ` L${coords[coords.length - 1].x},${padding + height}`;
  path += ` Z`;

  return path;
};

export default function WorkoutChart({ dateISO, counts, onBarClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate 7-day volume history
  const volumeHistory = useMemo(() => {
    const history: number[] = [];
    const d = new Date(dateISO);

    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date(d);
      checkDate.setDate(d.getDate() - i);
      const iso = toISODate(checkDate);
      const workout = readWorkout(iso);

      let totalVolume = 0;
      workout.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.type === "Working" || set.type === "Drop Set") {
            const avgReps = (set.repsMin + set.repsMax) / 2;
            totalVolume += set.weight * avgReps;
          }
        });
      });

      history.push(totalVolume);
    }

    return history;
  }, [dateISO]);

  // Build bars for today
  const bars = useMemo(() => {
    return MUSCLE_ORDER
      .map((muscle) => ({ muscle, sets: counts[muscle] || 0 }))
      .filter((item) => item.sets > 0)
      .sort((a, b) => b.sets - a.sets);
  }, [counts]);

  const total = bars.reduce((sum, bar) => sum + bar.sets, 0);
  const maxSets = Math.max(1, ...bars.map((b) => b.sets));

  const isEmpty = total === 0;

  // Chart dimensions
  const sparklineHeight = 60;
  const sparklinePadding = 8;
  const barHeight = 32;
  const barSpacing = 8;
  const labelWidth = 100;
  const valueWidth = 40;
  const barAreaWidth = width - labelWidth - valueWidth - 32; // padding

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm p-4"
    >
      <h3 className="text-lg font-semibold mb-4">Workout Summary</h3>

      {isEmpty ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-12">
          No workout data for {new Date(dateISO).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sparkline */}
          {volumeHistory.some((v) => v > 0) && (
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Volume (last 7 days)</div>
              <svg
                width={width - 32}
                height={sparklineHeight}
                className="overflow-visible"
                style={{ display: "block" }}
              >
                {/* Area fill */}
                <path
                  d={sparklineAreaPath(
                    volumeHistory,
                    width - 32 - sparklinePadding * 2,
                    sparklineHeight - sparklinePadding * 2,
                    sparklinePadding
                  )}
                  fill="currentColor"
                  className="text-accent-workout opacity-20"
                />
                {/* Line stroke */}
                <path
                  d={sparklinePath(
                    volumeHistory,
                    width - 32 - sparklinePadding * 2,
                    sparklineHeight - sparklinePadding * 2,
                    sparklinePadding
                  )}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent-workout"
                />
              </svg>
            </div>
          )}

          {/* Bars */}
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Sets by Muscle Group</div>
            <div className="space-y-2">
              {bars.map(({ muscle, sets }) => {
                const barWidth = (sets / maxSets) * barAreaWidth;

                return (
                  <button
                    key={muscle}
                    onClick={() => onBarClick?.(muscle)}
                    className="w-full grid items-center gap-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg px-2 py-1 transition-colors"
                    style={{
                      gridTemplateColumns: `${labelWidth}px 1fr ${valueWidth}px`,
                    }}
                  >
                    {/* Label */}
                    <span className="text-sm font-medium truncate">{muscle}</span>

                    {/* Bar */}
                    <div className="relative h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                      <svg
                        width={barAreaWidth}
                        height={barHeight}
                        className="absolute inset-0"
                        style={{ display: "block" }}
                      >
                        <defs>
                          <linearGradient id={`grad-${muscle}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--accent-workout)" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="var(--accent-workout)" stopOpacity="0.32" />
                          </linearGradient>
                        </defs>
                        <path
                          d={roundedRectPath(0, 0, barWidth, barHeight, 12)}
                          fill={`url(#grad-${muscle})`}
                        />
                      </svg>
                    </div>

                    {/* Value */}
                    <span className="text-sm font-semibold text-right tabular-nums">{sets}</span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 px-2">
              <span>0</span>
              <span className="text-center">Sets</span>
              <span>{maxSets}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
