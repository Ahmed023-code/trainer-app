"use client";

import { useMemo } from "react";

type RangeType = "1w" | "1m" | "3m" | "1y";

// Get weight data from localStorage
const getAllWeights = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem("progress-weight-by-day-v1");
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data || {};
  } catch {
    return {};
  }
};

// Generate full date range for the window
const generateDateRange = (range: RangeType): string[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = range === "1w" ? 7 : range === "1m" ? 30 : range === "3m" ? 90 : 365;
  const dates: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateISO = date.toISOString().split("T")[0];
    dates.push(dateISO);
  }

  return dates;
};

type WeightTrendCardProps = {
  currentView?: "day" | "week" | "month" | "3months" | "year";
};

// Map view to range
const viewToRange = (view: "day" | "week" | "month" | "3months" | "year"): RangeType => {
  if (view === "week") return "1w";
  if (view === "month") return "1m";
  if (view === "3months") return "3m";
  if (view === "year") return "1y";
  return "1w"; // Default for day view
};

export default function WeightTrendCard({ currentView = "week" }: WeightTrendCardProps) {
  const selectedRange = viewToRange(currentView);

  const allWeights = useMemo(() => getAllWeights(), []);

  // Generate full window data with nulls for missing days
  const windowData = useMemo(() => {
    const dates = generateDateRange(selectedRange);
    return dates.map((dateISO) => ({
      dateISO,
      weight: allWeights[dateISO] || null,
    }));
  }, [allWeights, selectedRange]);

  // Calculate stats from logged weights only
  const stats = useMemo(() => {
    const loggedWeights = windowData.filter((d) => d.weight !== null).map((d) => d.weight!);

    if (loggedWeights.length === 0) {
      return { latest: 0, start: 0, delta: 0, min: 0, max: 0, firstDate: "", lastDate: "" };
    }

    const latest = loggedWeights[loggedWeights.length - 1];
    const start = loggedWeights[0];
    const delta = latest - start;
    const min = Math.min(...loggedWeights);
    const max = Math.max(...loggedWeights);

    // Find first and last logged dates
    const firstLogged = windowData.find((d) => d.weight !== null);
    const lastLogged = [...windowData].reverse().find((d) => d.weight !== null);

    return {
      latest,
      start,
      delta,
      min,
      max,
      firstDate: firstLogged?.dateISO || "",
      lastDate: lastLogged?.dateISO || "",
    };
  }, [windowData]);

  const hasData = windowData.some((d) => d.weight !== null);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Weight Trend</h3>
      </div>

      {/* Chart */}
      {hasData ? (
        <div>
          <WeightLineChart data={windowData} range={selectedRange} />

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--accent-progress)]">
                {stats.latest.toFixed(1)}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Current</div>
            </div>

            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  stats.delta > 0
                    ? "text-red-500"
                    : stats.delta < 0
                    ? "text-green-500"
                    : "text-neutral-500"
                }`}
              >
                {stats.delta > 0 && "+"}
                {stats.delta.toFixed(1)}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Change</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Range</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-sm text-neutral-500">
          No weight data for this range
        </div>
      )}
    </div>
  );
}

// Line chart for weight with null handling
function WeightLineChart({ data, range }: { data: Array<{ dateISO: string; weight: number | null }>; range: RangeType }) {
  const loggedData = data.filter((d) => d.weight !== null) as Array<{ dateISO: string; weight: number }>;

  if (loggedData.length === 0) return null;

  const allWeights = loggedData.map((d) => d.weight);
  const maxValue = Math.max(...allWeights);
  const minValue = Math.min(...allWeights);
  const rangeValue = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 440;
  const height = 180;
  const chartHeight = height - padding.top - padding.bottom;

  // Map all data points to x positions (including nulls)
  const xStep = (chartWidth - padding.left - padding.right) / Math.max(data.length - 1, 1);

  const allPoints = data.map((d, i) => {
    const x = padding.left + i * xStep;
    if (d.weight === null) {
      return { x, y: null, weight: null, dateISO: d.dateISO };
    }
    const y = padding.top + chartHeight - ((d.weight - minValue) / rangeValue) * chartHeight;
    return { x, y, weight: d.weight, dateISO: d.dateISO };
  });

  // Build smooth path using cubic Bézier curves (connect all logged points, skip nulls)
  const loggedPoints = allPoints.filter(p => p.y !== null);

  // Helper to create smooth curve through points using cubic Bézier
  const createSmoothPath = (points: typeof allPoints): string => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // Calculate control points for smooth curve
      const tension = 0.3; // Lower = smoother, higher = closer to original points

      // Get neighboring points for smoother transitions
      const prev = i > 0 ? points[i - 1] : current;
      const afterNext = i < points.length - 2 ? points[i + 2] : next;

      // Calculate control point 1 (affects curve leaving current point)
      const cp1x = current.x! + (next.x! - prev.x!) * tension;
      const cp1y = current.y! + (next.y! - prev.y!) * tension;

      // Calculate control point 2 (affects curve approaching next point)
      const cp2x = next.x! - (afterNext.x! - current.x!) * tension;
      const cp2y = next.y! - (afterNext.y! - current.y!) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  const pathD = createSmoothPath(loggedPoints);

  // Format label for x-axis
  const labelEvery = range === "1w" ? 1 : range === "1m" ? 5 : range === "3m" ? 15 : 60;
  const formatLabel = (dateISO: string) => {
    const date = new Date(dateISO + "T00:00:00");
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const value = (minValue + rangeValue * ratio).toFixed(1);
        return (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={y}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              className="opacity-50"
              dominantBaseline="middle"
            >
              {value}
            </text>
          </g>
        );
      })}

      {/* Smooth line connecting all logged points */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent-progress)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dots for logged weights only (hidden for year view) */}
      {range !== "1y" && loggedPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2"
          fill="var(--accent-progress)"
          stroke="white"
          strokeWidth="1.5"
        >
          <title>
            {p.dateISO}: {p.weight!.toFixed(1)} lbs
          </title>
        </circle>
      ))}

      {/* X-axis labels */}
      {allPoints.map((p, i) => {
        const showLabel = i % labelEvery === 0 || i === allPoints.length - 1;
        return showLabel ? (
          <text
            key={i}
            x={p.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            className="opacity-50"
          >
            {formatLabel(p.dateISO)}
          </text>
        ) : null;
      })}

      {/* Latest value callout */}
      {loggedData.length > 0 && allPoints[allPoints.length - 1].y !== null && (
        <text
          x={allPoints[allPoints.length - 1].x}
          y={allPoints[allPoints.length - 1].y! - 12}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill="var(--accent-progress)"
        >
          {loggedData[loggedData.length - 1].weight.toFixed(1)}
        </text>
      )}
    </svg>
  );
}
