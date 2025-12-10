import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        muted: "var(--muted)",
        border: "var(--border)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "accent-diet": "var(--accent-diet)",
        "accent-diet-fat": "var(--accent-diet-fat)",
        "accent-workout": "var(--accent-workout)",
        "accent-progress": "var(--accent-progress)",
        "accent-home": "var(--accent-home)"
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(280px)', opacity: '1' },
        }
      },
      animation: {
        scan: 'scan 2s ease-in-out infinite',
      }
    }
  },
  plugins: []
} satisfies Config;
