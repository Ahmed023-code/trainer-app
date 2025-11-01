"use client";

import { useState, useEffect } from "react";

const APP_VERSION = "1.1.0";
const VERSION_STORAGE_KEY = "last-seen-version";

const CHANGELOG = {
  "1.1.0": {
    date: "2025-01-28",
    changes: [
      "Added Exercise History with weekly graphs, best set, and e1RM tracking",
      "New Goal Rings showing weekly workout and nutrition progress",
      "Meal Templates - save and reuse your favorite meals",
      "Smart Onboarding wizard for new users",
      "Theme switcher (Light/Dark/System) and unit preferences",
      "Local Reminders and Notifications system",
      "Daily Mood and Energy tracking",
      "Data Backup and Restore feature",
      "Performance improvements and bug fixes",
    ],
  },
  "1.0.0": {
    date: "2025-01-15",
    changes: [
      "Initial release",
      "Workout tracking with sets, reps, and RPE",
      "Diet logging with macro tracking",
      "Progress tracking with weight trends",
      "Day/Week/Month/Year views",
      "Photo gallery for progress pics",
    ],
  },
};

export default function VersionBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastSeenVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    if (lastSeenVersion !== APP_VERSION) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const currentChangelog = CHANGELOG[APP_VERSION as keyof typeof CHANGELOG];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--accent-progress)] to-[var(--accent-workout)] text-white p-4 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold">🎉</span>
              <h3 className="font-semibold">New in v{APP_VERSION}!</h3>
            </div>
            <p className="text-sm text-white/90 mb-2">
              {currentChangelog?.changes.length || 0} new features and improvements
            </p>
            <button
              onClick={() => setShowBanner(false)}
              className="text-sm underline hover:no-underline"
            >
              View what's new
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>

        {/* Expanded view */}
        {showBanner && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs text-white/80 mb-2">Released {currentChangelog?.date}</div>
            <ul className="space-y-1.5 text-sm">
              {currentChangelog?.changes.map((change, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-white/60">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleDismiss}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
            >
              Got it!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export version for use elsewhere
export { APP_VERSION };
