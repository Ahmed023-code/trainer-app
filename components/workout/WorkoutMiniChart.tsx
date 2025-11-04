// CHANGE: New emoji-free SVG chart component for workout data visualization
// Supports area and column variants with mobile-friendly tooltips
"use client";

import { useState } from "react";

type DataPoint = {
  label: string;
  value: number;
};

type Props = {
  data: DataPoint[];
  variant?: "area" | "column";
  height?: number;
  accentColor?: string;
};

export default function WorkoutMiniChart({
  data,
  variant = "area",
  height = 160,
  accentColor = "#FACC15",
}: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);
  const [locked, setLocked] = useState(false);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur"
        style={{ minHeight: height }}
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No data</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 16, right: 16, bottom: 32, left: 40 };
  const chartWidth = 400; // viewBox width
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Generate grid lines (25% intervals)
  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding.top + innerHeight * (1 - ratio);
    const value = Math.round(maxValue * ratio);
    return { y, value };
  });

  if (variant === "area") {
    // Area chart with smooth curve
    const stepX = innerWidth / (data.length - 1 || 1);
    const points = data.map((d, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + innerHeight - (d.value / maxValue) * innerHeight,
      data: d,
    }));

    // Generate smooth path
    let linePath = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x},${points[i].y}`;
    }

    // Area path (fill below line)
    let areaPath = `M ${padding.left},${padding.top + innerHeight}`;
    areaPath += ` L ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      areaPath += ` L ${points[i].x},${points[i].y}`;
    }
    areaPath += ` L ${points[points.length - 1].x},${padding.top + innerHeight} Z`;

    const handlePointInteraction = (point: typeof points[0], e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgRect = e.currentTarget.closest("svg")?.getBoundingClientRect();
      if (!svgRect) return;

      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;

      if (locked) {
        setLocked(false);
        setTooltip(null);
      } else {
        setTooltip({ x, y, point: point.data });
        setLocked(true);
      }
    };

    return (
      <div className="relative w-full rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-3 py-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minHeight: height }}
        >
          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={chartWidth - padding.right}
                y2={line.y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-neutral-300 dark:text-neutral-700"
                opacity="0.5"
              />
              <text
                x={padding.left - 8}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] fill-neutral-500 dark:fill-neutral-400"
              >
                {line.value}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={accentColor} opacity="0.2" className="animate-fade-in" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-fade-in"
          />

          {/* Interactive points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={accentColor}
              className="cursor-pointer hover:r-8 transition-all"
              onPointerDown={(e) => handlePointInteraction(point, e)}
              aria-label={`${point.data.label}: ${point.data.value}`}
              role="button"
              tabIndex={0}
            />
          ))}

          {/* X-axis labels */}
          {points.map((point, i) => (
            <text
              key={i}
              x={point.x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="text-[10px] fill-neutral-500 dark:fill-neutral-400"
            >
              {point.data.label}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 shadow-lg pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 50,
              transform: "translate(-50%, 0)",
            }}
          >
            <p className="text-xs font-medium">{tooltip.point.label}</p>
            <p className="text-sm font-bold" style={{ color: accentColor }}>
              {tooltip.point.value}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Column chart
  const barWidth = Math.min(innerWidth / data.length - 4, 40);
  const barGap = 4;
  const totalBarSpace = (barWidth + barGap) * data.length - barGap;
  const startX = padding.left + (innerWidth - totalBarSpace) / 2;

  const bars = data.map((d, i) => ({
    x: startX + i * (barWidth + barGap),
    y: padding.top + innerHeight - (d.value / maxValue) * innerHeight,
    height: (d.value / maxValue) * innerHeight,
    data: d,
  }));

  const handleBarTap = (bar: typeof bars[0], e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.closest("svg")?.getBoundingClientRect();
    if (!svgRect) return;

    const x = rect.left + rect.width / 2 - svgRect.left;
    const y = rect.top - svgRect.top;

    if (locked && tooltip?.point.label === bar.data.label) {
      setLocked(false);
      setTooltip(null);
    } else {
      setTooltip({ x, y, point: bar.data });
      setLocked(true);
    }
  };

  return (
    <div className="relative w-full rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur px-3 py-2">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ minHeight: height }}
      >
        {/* Grid lines */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={chartWidth - padding.right}
              y2={line.y}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="text-neutral-300 dark:text-neutral-700"
              opacity="0.5"
            />
            <text
              x={padding.left - 8}
              y={line.y + 4}
              textAnchor="end"
              className="text-[10px] fill-neutral-500 dark:fill-neutral-400"
            >
              {line.value}
            </text>
          </g>
        ))}

        {/* Bars */}
        {bars.map((bar, i) => (
          <g key={i}>
            <rect
              x={bar.x}
              y={bar.y}
              width={barWidth}
              height={bar.height}
              rx="6"
              ry="6"
              fill={accentColor}
              opacity="0.8"
              className="cursor-pointer hover:opacity-100 transition-opacity animate-fade-in"
              onPointerDown={(e) => handleBarTap(bar, e)}
              aria-label={`${bar.data.label}: ${bar.data.value}`}
              role="button"
              tabIndex={0}
            />
            <text
              x={bar.x + barWidth / 2}
              y={chartHeight - 8}
              textAnchor="middle"
              className="text-[10px] fill-neutral-500 dark:fill-neutral-400"
            >
              {bar.data.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 50,
            transform: "translate(-50%, 0)",
          }}
        >
          <p className="text-xs font-medium">{tooltip.point.label}</p>
          <p className="text-sm font-bold" style={{ color: accentColor }}>
            {tooltip.point.value}
          </p>
        </div>
      )}
    </div>
  );
}
