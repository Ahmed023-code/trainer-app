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
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Profile</h2>
          <button
            onClick={() => setShowProfileEdit(!showProfileEdit)}
            className="text-sm text-accent-home hover:underline"
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
                className="w-full px-5 py-2 rounded-full border border-border bg-card text-text focus:ring-2 focus:ring-accent-home focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={!displayName.trim()}
              className="w-full px-6 py-2 rounded-full bg-accent-home text-white font-medium hover:opacity-90 disabled:opacity-50"
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
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Appearance</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    theme === t
                      ? "bg-[var(--accent-home)] text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Units</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Weight</label>
            <div className="flex gap-2">
              {(["lbs", "kg"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setWeightUnit(unit)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    weightUnit === unit
                      ? "bg-[var(--accent-home)] text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    energyUnit === unit
                      ? "bg-[var(--accent-home)] text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
      <section className="rounded-full border border-[var(--accent-workout)]/30 bg-gradient-to-br from-[var(--accent-workout)]/10 to-white/70 dark:to-neutral-900/60 backdrop-blur p-4 shadow-sm hover:shadow-md transition-shadow">
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
      <section className="rounded-full border border-[var(--accent-diet)]/30 bg-gradient-to-br from-[var(--accent-diet)]/10 to-white/70 dark:to-neutral-900/60 backdrop-blur p-4 shadow-sm hover:shadow-md transition-shadow">
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
      <section className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/60 backdrop-blur p-4 shadow-sm">
        <h2 className="font-semibold mb-2 text-red-600 dark:text-red-400">Logout</h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">
          This will clear all app data including workouts, meals, and progress.
        </p>
        {showLogoutConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-6 py-2 rounded-full border border-border font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-2 rounded-full bg-red-600 text-white font-medium hover:opacity-90"
            >
              Confirm Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-6 py-2 rounded-full border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 font-medium hover:bg-red-600/10"
          >
            Logout
          </button>
        )}
      </section>
    </main>
  );
}
