"use client";

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
}: {
  calories: RingProps;
  protein: RingProps;
  fat: RingProps;
  carbs: RingProps;
}) {
  const rings = [calories, protein, fat, carbs];

  return (
    <div className="rounded-3xl p-4 border border-neutral-200 dark:border-neutral-800 bg-white/10 dark:bg-neutral-900/30 backdrop-blur shadow-inner">
      <div className="flex items-center gap-4 justify-around">
        {rings.map((r) => (
          <Ring key={r.label} {...r} />
        ))}
      </div>
    </div>
  );
}

function Ring({ label, current, target, color }: RingProps) {
  const size = 70; // diameter
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, target > 0 ? current / target : 0));
  const dash = circumference * pct;

  return (
    <div className="flex flex-col items-center justify-center flex-none shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 rotate-[-90deg]">
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
          {/* Progress */}
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
        </svg>

        {/* Center label as colored circle with black text */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="inline-grid place-items-center rounded-full font-extrabold text-[11px] leading-none"
            style={{ width: 26, height: 26, backgroundColor: color, color: "#000" }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Value bubble under ring */}
      <div className="mt-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {Math.round(current)}/{Math.round(target)}
        </span>
      </div>
    </div>
  );
}