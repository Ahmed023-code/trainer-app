// CHANGE: New completion badge with animated gradient for day completion
"use client";

export default function CompletionBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-green-500/10 via-purple-500/10 to-cyan-500/10 border border-green-500/30 animate-pulse">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-draw"
      >
        <defs>
          <linearGradient id="completion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06b6d4" />
            <animate
              attributeName="x1"
              values="0%;100%;0%"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="100%;0%;100%"
              dur="2s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="url(#completion-gradient)"
          strokeWidth="2"
          fill="none"
          className="animate-spin-slow"
        />
        <path
          d="M8 12.5l2.5 2.5 5.5-5.5"
          stroke="url(#completion-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="text-xs font-medium bg-gradient-to-r from-green-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
        Day Complete
      </span>
    </div>
  );
}
