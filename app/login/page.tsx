"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadMockData } from "@/utils/mockData";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const profile = localStorage.getItem("profile-v1");
    if (profile) {
      try {
        const data = JSON.parse(profile);
        if (data.displayName) {
          router.push("/");
        }
      } catch {
        // Invalid data, stay on login
      }
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Save display name
    const profile = {
      displayName: name.trim(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("profile-v1", JSON.stringify(profile));

    // Navigate to home
    router.push("/");
  };

  const handleLoadMockData = () => {
    setIsLoadingMock(true);
    try {
      loadMockData();
      // Small delay for user feedback
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      console.error("Failed to load mock data:", error);
      setIsLoadingMock(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome</h1>
          <p className="text-text-muted">Enter your name to get started</p>
        </div>

        <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)] text-text border-none focus:outline-none focus:ring-2 focus:ring-accent-home/30 transition-all duration-200"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full px-4 py-3 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-accent-home font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-bg text-text-muted">Or try the app with sample data</span>
          </div>
        </div>

        {/* Load Mock Data Button */}
        <button
          onClick={handleLoadMockData}
          disabled={isLoadingMock}
          className="w-full px-4 py-3 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-accent-home font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingMock ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            "Load Mock Data"
          )}
        </button>

        {/* Info text */}
        <p className="text-center text-xs text-text-muted mt-4">
          Mock data includes sample workouts, meals, weight logs, and routines for testing
        </p>
      </div>
    </main>
  );
}
