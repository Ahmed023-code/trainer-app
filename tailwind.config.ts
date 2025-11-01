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
      }
    }
  },
  plugins: []
} satisfies Config;
