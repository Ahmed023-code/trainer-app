"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { theme, weightUnit, energyUnit, setTheme, setWeightUnit, setEnergyUnit } = useSettingsStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();

  // Load profile on mount
  useEffect(() => {
    try {
      const profile = localStorage.getItem("profile-v1");
      if (profile) {
        const data = JSON.parse(profile);
        setDisplayName(data.displayName || "");
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }, []);

  const handleSaveProfile = () => {
    const profile = {
      displayName: displayName.trim(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("profile-v1", JSON.stringify(profile));
    setShowProfileEdit(false);
  };

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.clear();

    // Clear IndexedDB (for media storage)
    if (typeof window !== "undefined" && window.indexedDB) {
      const DBDeleteRequest = window.indexedDB.deleteDatabase("trainer-app-media");
      DBDeleteRequest.onsuccess = () => {
        console.log("Database deleted successfully");
      };
    }

    // Navigate to login
    router.push("/login");
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      <h1 className="text-xl font-semibold pt-4">Settings</h1>

      {/* Profile */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Profile</h2>
          <button
            onClick={() => setShowProfileEdit(!showProfileEdit)}
            className="text-sm text-accent-home hover:underline transition-colors"
          >
            {showProfileEdit ? "Cancel" : "Edit"}
          </button>
        </div>

        {showProfileEdit ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-5 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)] text-text border-none focus:outline-none focus:ring-2 focus:ring-accent-home/30 transition-all duration-200"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={!displayName.trim()}
              className="w-full px-6 py-2 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-accent-home font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Profile
            </button>
          </div>
        ) : (
          <div className="text-sm">
            <div className="flex justify-between py-2">
              <span className="text-neutral-500 dark:text-neutral-400">Name</span>
              <span className="font-medium">{displayName || "Not set"}</span>
            </div>
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
        <h2 className="font-semibold mb-3">Appearance</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    theme === t
                      ? "bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-[var(--accent-home)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
                      : "bg-neutral-100 dark:bg-neutral-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {t === "light" && "☀️ Light"}
                  {t === "dark" && "🌙 Dark"}
                  {t === "system" && "💻 System"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
        <h2 className="font-semibold mb-3">Units</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Weight</label>
            <div className="flex gap-2">
              {(["lbs", "kg"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setWeightUnit(unit)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    weightUnit === unit
                      ? "bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-[var(--accent-home)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
                      : "bg-neutral-100 dark:bg-neutral-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Energy</label>
            <div className="flex gap-2">
              {(["kcal", "kJ"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setEnergyUnit(unit)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    energyUnit === unit
                      ? "bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-[var(--accent-home)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
                      : "bg-neutral-100 dark:bg-neutral-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workout Settings link */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4 transition-all duration-200 hover:shadow-[10px_10px_20px_rgba(0,0,0,0.12),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:hover:shadow-[10px_10px_20px_rgba(0,0,0,0.6),-10px_-10px_20px_rgba(255,255,255,0.08)]">
        <a href="/settings/workout" className="block">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Workout Settings</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Set your training frequency, split, and focus.
              </div>
            </div>
            <span className="text-[var(--accent-workout)]">›</span>
          </div>
        </a>
      </section>

      {/* Diet Settings link */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4 transition-all duration-200 hover:shadow-[10px_10px_20px_rgba(0,0,0,0.12),-10px_-10px_20px_rgba(255,255,255,0.8)] dark:hover:shadow-[10px_10px_20px_rgba(0,0,0,0.6),-10px_-10px_20px_rgba(255,255,255,0.08)]">
        <a href="/settings/diet" className="block">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Diet Settings</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Set your calorie and macro goals.
              </div>
            </div>
            <span className="text-[var(--accent-diet)]">›</span>
          </div>
        </a>
      </section>

      {/* Logout */}
      <section className="rounded-3xl bg-red-50 dark:bg-red-950/30 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
        <h2 className="font-semibold mb-2 text-red-600 dark:text-red-400">Logout</h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">
          This will clear all app data including workouts, meals, and progress.
        </p>
        {showLogoutConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-6 py-2 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-2 rounded-full bg-red-600 dark:bg-red-700 shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.3)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.05)] text-white font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.2)]"
            >
              Confirm Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-6 py-2 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-red-600 dark:text-red-400 font-semibold transition-all duration-200 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
          >
            Logout
          </button>
        )}
      </section>
    </main>
  );
}
