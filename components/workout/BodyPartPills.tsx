import React from "react";

interface BodyPartPillsProps {
  setCounts: Record<string, number>;
}

export default function BodyPartPills({ setCounts }: BodyPartPillsProps) {
  // Helper to capitalize muscle names
  const capitalizeMuscle = (muscle: string) => {
    return muscle
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter to only show body parts with working sets > 0
  const activeParts = Object.entries(setCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  // Don't render anything if no exercises were done
  if (activeParts.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <h3 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-400">
        Body Parts Trained Today
      </h3>
      <div className="flex flex-wrap gap-2">
        {activeParts.map(([bodyPart, count]) => (
          <div
            key={bodyPart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--accent-workout)]/20 to-[var(--accent-workout)]/10 border border-[var(--accent-workout)]/30 shadow-sm"
          >
            <span className="font-medium text-sm" style={{ color: "var(--accent-workout)" }}>
              {capitalizeMuscle(bodyPart)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#8ff000] text-black text-xs font-bold">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
