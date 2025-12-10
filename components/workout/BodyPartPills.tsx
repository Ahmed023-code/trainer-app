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
    <div className="mt-4 rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
      <h3 className="text-sm font-medium mb-3 text-neutral-600 dark:text-neutral-400">
        Body Parts Trained Today
      </h3>
      <div className="flex flex-wrap gap-2">
        {activeParts.map(([bodyPart, count]) => (
          <div
            key={bodyPart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]"
          >
            <span className="font-medium text-sm" style={{ color: "var(--accent-workout)" }}>
              {capitalizeMuscle(bodyPart)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600 text-black dark:text-white text-xs font-bold shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
