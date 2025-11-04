"use client";

import { useMemo, useState } from "react";

// Epley formula: 1RM = w * (1 + reps/30)
const calculateE1RM = (weight: number, reps: number): number => {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
};

// Read all workout dates from localStorage
const getAllWorkoutDates = (): string[] => {
  try {
    const raw = localStorage.getItem("workout-by-day-v2");
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Object.keys(data).sort();
  } catch {
    return [];
  }
};

// Get exercise history across all dates
const getExerciseHistory = (exerciseName: string) => {
  try {
    const raw = localStorage.getItem("workout-by-day-v2");
    if (!raw) return [];

    const allData = JSON.parse(raw);
    const history: Array<{
      dateISO: string;
      sets: Array<{ weight: number; reps: number; rpe: number }>;
    }> = [];

    for (const [dateISO, dayData] of Object.entries(allData)) {
      const exercises = (dayData as any)?.exercises || [];
      const match = exercises.find(
        (ex: any) => ex.name.toLowerCase().trim() === exerciseName.toLowerCase().trim()
      );

      if (match && Array.isArray(match.sets)) {
        const sets = match.sets
          .filter((s: any) => {
            const type = String(s?.type || "Working");
            return type === "Working" || type === "Drop Set";
          })
          .map((s: any) => ({
            weight: Number(s?.weight || 0),
            reps: Number(s?.repsMax || s?.reps || 0),
            rpe: Number(s?.rpe || 0),
          }));

        if (sets.length > 0) {
          history.push({ dateISO, sets });
        }
      }
    }

    return history.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  } catch {
    return [];
  }
};

// Calculate weekly aggregates
const getWeeklyData = (
  history: Array<{ dateISO: string; sets: Array<{ weight: number; reps: number; rpe: number }> }>,
  metric: "weight" | "reps"
) => {
  // Group by week (YYYY-Www)
  const weekMap = new Map<string, { dateISO: string; value: number }>();

  for (const session of history) {
    const date = new Date(session.dateISO + "T00:00:00");
    const year = date.getFullYear();

    // Get ISO week number
    const d = new Date(Date.UTC(year, date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const weekKey = `${year}-W${String(weekNo).padStart(2, "0")}`;

    let value = 0;

    if (metric === "weight") {
      // Top set weight
      value = Math.max(...session.sets.map(s => s.weight), 0);
    } else if (metric === "reps") {
      // Total reps
      value = session.sets.reduce((sum, s) => sum + s.reps, 0);
    }

    const existing = weekMap.get(weekKey);
    if (!existing || value > existing.value) {
      weekMap.set(weekKey, { dateISO: session.dateISO, value });
    }
  }

  const sorted = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12); // Last 12 weeks

  return sorted.map(([weekKey, data]) => ({
    label: weekKey.split("-W")[1] ? `W${weekKey.split("-W")[1]}` : weekKey,
    value: Math.round(data.value),
  }));
};

type DataPoint = { label: string; value: number };

type ExerciseHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  dateISO?: string;
};

export default function ExerciseHistoryModal({
  isOpen,
  onClose,
  exerciseName,
  dateISO,
}: ExerciseHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "best" | "e1rm">("weekly");
  const [metric, setMetric] = useState<"weight" | "reps">("weight");

  const history = useMemo(() => getExerciseHistory(exerciseName), [exerciseName]);

  const weeklyData = useMemo(() => getWeeklyData(history, metric), [history, metric]);

  // Best set calculation
  const bestSet = useMemo(() => {
    let best: { dateISO: string; weight: number; reps: number } | null = null;
    let maxProduct = 0;

    for (const session of history) {
      for (const set of session.sets) {
        const product = set.weight * set.reps;
        if (product > maxProduct) {
          maxProduct = product;
          best = { dateISO: session.dateISO, weight: set.weight, reps: set.reps };
        }
      }
    }

    return best;
  }, [history]);

  // e1RM data (last 12 sessions)
  const e1rmData = useMemo(() => {
    const sessions = history.slice(-12);
    return sessions.map((session, idx) => {
      const topSet = session.sets.reduce(
        (max, s) => {
          const e1rm = calculateE1RM(s.weight, s.reps);
          return e1rm > max.e1rm ? { e1rm, weight: s.weight, reps: s.reps } : max;
        },
        { e1rm: 0, weight: 0, reps: 0 }
      );

      return {
        label: `S${idx + 1}`,
        value: Math.round(topSet.e1rm),
        dateISO: session.dateISO,
      };
    });
  }, [history]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9700]">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-[480px] mx-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold truncate">{exerciseName}</h2>
          <button
            className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 grid place-items-center"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["weekly", "best", "e1rm"] as const).map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-accent-workout text-black"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "weekly" && "Weekly"}
              {tab === "best" && "Best Set"}
              {tab === "e1rm" && "e1RM"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[240px]">
          {activeTab === "weekly" && (
            <div>
              {/* Metric selector */}
              <div className="flex gap-2 mb-3">
                {(["weight", "reps"] as const).map((m) => (
                  <button
                    key={m}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      metric === m
                        ? "bg-neutral-200 dark:bg-neutral-800"
                        : "text-neutral-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                    onClick={() => setMetric(m)}
                  >
                    {m === "weight" && "Top Weight"}
                    {m === "reps" && "Reps"}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {weeklyData.length > 0 ? (
                <MiniLineChart data={weeklyData} height={180} accentColor="var(--accent-workout)" />
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-neutral-500">
                  No weekly data available
                </div>
              )}
            </div>
          )}

          {activeTab === "best" && (
            <div className="flex flex-col items-center justify-center h-48">
              {bestSet ? (
                <>
                  <div className="text-5xl font-bold text-accent-workout mb-2">
                    {bestSet.weight} <span className="text-2xl">lbs</span>
                  </div>
                  <div className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">
                    × {bestSet.reps} reps
                  </div>
                  <div className="text-sm text-neutral-500">
                    {new Date(bestSet.dateISO).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <button
                    className="mt-3 px-4 py-2 rounded-full text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    onClick={() => {
                      // Deep link to that date's workout
                      localStorage.setItem("ui-last-date-workout", bestSet.dateISO);
                      onClose();
                      // If on workout page, trigger reload by dispatching event
                      window.dispatchEvent(new CustomEvent("workout-date-change"));
                    }}
                  >
                    View Workout
                  </button>
                </>
              ) : (
                <div className="text-sm text-neutral-500">No sets recorded</div>
              )}
            </div>
          )}

          {activeTab === "e1rm" && (
            <div>
              {e1rmData.length > 0 ? (
                <MiniLineChart data={e1rmData} height={180} accentColor="var(--accent-progress)" showDots />
              ) : (
                <div className="flex items-center justify-center h-48 text-sm text-neutral-500">
                  No e1RM data available
                </div>
              )}
              <p className="text-xs text-neutral-500 mt-2 text-center">
                Estimated 1RM using Epley formula: weight × (1 + reps/30)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 text-center">
          {history.length} session{history.length !== 1 ? "s" : ""} recorded
        </div>
      </div>
    </div>
  );
}

// Mini line chart component
function MiniLineChart({
  data,
  height = 180,
  accentColor = "#FACC15",
  showDots = false,
}: {
  data: DataPoint[];
  height?: number;
  accentColor?: string;
  showDots?: boolean;
}) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 440;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = (chartWidth - padding.left - padding.right) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const value = Math.round(minValue + range * ratio);
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

      {/* Line */}
      <path d={pathD} fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Area fill */}
      <path
        d={`${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
        fill={accentColor}
        fillOpacity="0.1"
      />

      {/* Dots */}
      {showDots &&
        points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={accentColor} stroke="white" strokeWidth="2" />
        ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={height - padding.bottom + 20}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="opacity-50"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
