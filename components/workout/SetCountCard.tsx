"use client";

type Props = {
  // Map of muscle -> count. We render as "Working sets".
  counts: Record<string, number>;
};

const ORDER = [
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

export default function SetCountCard({ counts }: Props) {
  const EMOJI: Record<string, string> = {
    Quads: "🦵",
    Glutes: "🍑",
    Hamstrings: "🧵",
    Calves: "🐐",
    Chest: "🫁",
    Back: "🎒",
    Shoulders: "🏋️",
    Biceps: "💪",
    Triceps: "🦾",
    Core: "🧩",
  };

  // Build rows, keep >0, sort descending
  const rows = ORDER
    .map((k) => ({ k, v: Math.max(0, Number(counts[k] ?? 0)) }))
    .filter((r) => r.v > 0)
    .sort((a, b) => b.v - a.v);

  const total = rows.reduce((a, r) => a + r.v, 0);
  const maxVal = Math.max(1, ...rows.map((r) => r.v));

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur shadow-sm hover:shadow-md hover:border-blue-300 transition-shadow p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Muscle Groups Worked</h3>
        <div className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
          Total working sets: {total}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
          No working sets yet.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Axis header */}
          <div className="grid grid-cols-[140px,1fr,56px] text-[11px] text-neutral-600 dark:text-neutral-400 px-1">
            <span className="truncate">Muscle</span>
            <span className="pl-2">Sets</span>
            <span className="text-right">#</span>
          </div>

          {/* Bars */}
          <ul className="space-y-2">
            {rows.map(({ k, v }) => {
              const pct = (v / maxVal) * 100; // 0..100
              return (
                <li key={k} className="grid grid-cols-[140px,1fr,56px] items-center gap-2 px-1">
                  {/* Label with emoji */}
                  <div className="truncate text-sm flex items-center gap-2">
                    <span className="text-base">{EMOJI[k] || "🏷️"}</span>
                    <span>{k}</span>
                  </div>

                  {/* Gradient rounded bar */}
                  <div className="relative h-5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundImage: "linear-gradient(90deg, #60A5FA, #3B82F6)",
                      }}
                    />
                  </div>

                  {/* Value */}
                  <div className="text-right text-sm font-medium tabular-nums">{v}</div>
                </li>
              );
            })}
          </ul>

          {/* X-axis ticks */}
          <div className="mt-2 px-1">
            <div className="relative h-4">
              {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                const x = `${f * 100}%`;
                const val = Math.round(maxVal * f);
                return (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2"
                    style={{ left: `calc(140px + ${x} * (100% - 140px - 56px) / 100)` }}
                  >
                    <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700 mx-auto" />
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 tabular-nums">{val}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}