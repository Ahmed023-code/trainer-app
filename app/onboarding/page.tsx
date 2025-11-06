"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState("");

  const handleContinue = () => {
    if (name.trim()) {
      // Save name to localStorage
      const profile = {
        displayName: name.trim(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("profile-v1", JSON.stringify(profile));

      // Navigate to profile/diet info page
      router.push("/onboarding/profile");
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-accent-home/10 to-white dark:to-neutral-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Welcome!</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Let's get you set up to track your fitness journey
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-6 shadow-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">What's your name?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleContinue();
                }
              }}
              placeholder="Enter your name"
              className="w-full px-5 py-3 rounded-full border border-border bg-card text-text focus:ring-2 focus:ring-accent-home focus:outline-none"
              autoFocus
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={!name.trim()}
            className="w-full px-6 py-3 rounded-full bg-accent-home text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </div>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          This will only take a minute
        </p>
      </div>
    </main>
  );
}
