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

        <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-6 space-y-4">
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
              className="w-full px-5 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)] text-text border-none focus:outline-none focus:ring-2 focus:ring-accent-home/30 transition-all duration-200"
              autoFocus
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={!name.trim()}
            className="w-full px-6 py-3 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-accent-home font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
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
