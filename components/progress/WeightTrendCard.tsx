"use client";

import { useMemo, useState } from "react";

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
  range?: RangeType;
};

export default function WeightTrendCard({ range = "1w" }: WeightTrendCardProps) {
  const [selectedRange, setSelectedRange] = useState<RangeType>(range);

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

  // Window start and end labels
  const windowLabels = useMemo(() => {
    if (windowData.length === 0) return { start: "", end: "" };
    const startDate = new Date(windowData[0].dateISO + "T00:00:00");
    const endDate = new Date(windowData[windowData.length - 1].dateISO + "T00:00:00");

    return {
      start: `${startDate.getMonth() + 1}/${startDate.getDate()}`,
      end: `${endDate.getMonth() + 1}/${endDate.getDate()}`,
    };
  }, [windowData]);

  const hasData = windowData.some((d) => d.weight !== null);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Weight Trend</h3>
          {hasData && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {windowLabels.start} - {windowLabels.end}
            </div>
          )}
        </div>

        {/* Range selector */}
        <div className="flex gap-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
          {(["1w", "1m", "3m", "1y"] as const).map((r) => (
            <button
              key={r}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedRange === r
                  ? "bg-[var(--accent-progress)] text-white"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              onClick={() => setSelectedRange(r)}
            >
              {r === "1w" && "1W"}
              {r === "1m" && "1M"}
              {r === "3m" && "3M"}
              {r === "1y" && "1Y"}
            </button>
          ))}
        </div>
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

  // Build path segments (break on nulls)
  const pathSegments: string[] = [];
  let currentSegment: typeof allPoints = [];

  for (const point of allPoints) {
    if (point.y === null) {
      if (currentSegment.length > 0) {
        const pathD = currentSegment.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        pathSegments.push(pathD);
        currentSegment = [];
      }
    } else {
      currentSegment.push(point);
    }
  }

  if (currentSegment.length > 0) {
    const pathD = currentSegment.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    pathSegments.push(pathD);
  }

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

      {/* Line segments */}
      {pathSegments.map((pathD, i) => (
        <path
          key={i}
          d={pathD}
          fill="none"
          stroke="var(--accent-progress)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Dots for logged weights only */}
      {allPoints.map((p, i) =>
        p.y !== null && p.weight !== null ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="var(--accent-progress)"
            stroke="white"
            strokeWidth="2"
          >
            <title>
              {p.dateISO}: {p.weight.toFixed(1)} lbs
            </title>
          </circle>
        ) : null
      )}

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
