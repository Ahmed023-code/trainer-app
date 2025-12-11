"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs')
  const [energyUnit, setEnergyUnit] = useState<'kcal' | 'kJ'>('kcal')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      <h1 className="text-xl font-semibold pt-4">Settings</h1>

      {/* Profile */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-900 shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Profile</h2>
          <button className="text-sm text-accent-home transition-colors">
            Edit
          </button>
        </div>

        <div className="text-sm">
          <div className="flex justify-between py-2">
            <span className="text-neutral-500 dark:text-neutral-400">Name</span>
            <span className="font-medium">John Doe</span>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-900 shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)] p-5">
        <h2 className="font-semibold mb-3">Appearance</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    theme === t
                      ? "bg-neutral-200 dark:bg-neutral-800 shadow-[9px_9px_16px_rgba(0,0,0,0.2),-9px_-9px_16px_rgba(255,255,255,0.9)] dark:shadow-[9px_9px_16px_rgba(0,0,0,0.5),-9px_-9px_16px_rgba(255,255,255,0.08)] text-[var(--accent-home)]"
                      : "bg-neutral-100 dark:bg-neutral-900 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {t === 'light' && '☀️ Light'}
                  {t === 'dark' && '🌙 Dark'}
                  {t === 'system' && '💻 System'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-900 shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)] p-5">
        <h2 className="font-semibold mb-3">Units</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Weight</label>
            <div className="flex gap-2">
              {(['lbs', 'kg'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setWeightUnit(unit)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    weightUnit === unit
                      ? "bg-neutral-200 dark:bg-neutral-800 shadow-[9px_9px_16px_rgba(0,0,0,0.2),-9px_-9px_16px_rgba(255,255,255,0.9)] dark:shadow-[9px_9px_16px_rgba(0,0,0,0.5),-9px_-9px_16px_rgba(255,255,255,0.08)] text-[var(--accent-home)]"
                      : "bg-neutral-100 dark:bg-neutral-900 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] text-neutral-700 dark:text-neutral-300"
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
              {(['kcal', 'kJ'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setEnergyUnit(unit)}
                  className={`flex-1 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    energyUnit === unit
                      ? "bg-neutral-200 dark:bg-neutral-800 shadow-[9px_9px_16px_rgba(0,0,0,0.2),-9px_-9px_16px_rgba(255,255,255,0.9)] dark:shadow-[9px_9px_16px_rgba(0,0,0,0.5),-9px_-9px_16px_rgba(255,255,255,0.08)] text-[var(--accent-home)]"
                      : "bg-neutral-100 dark:bg-neutral-900 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] text-neutral-700 dark:text-neutral-300"
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
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-900 shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)] p-5">
        <div className="block">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Workout Settings</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Set your training frequency, split, and focus.
              </div>
            </div>
            <span className="text-[var(--accent-workout)]">›</span>
          </div>
        </div>
      </section>

      {/* Diet Settings link */}
      <section className="rounded-3xl bg-neutral-100 dark:bg-neutral-900 shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)] p-5">
        <div className="block">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Diet Settings</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Set your calorie and macro goals.
              </div>
            </div>
            <span className="text-[var(--accent-diet)]">›</span>
          </div>
        </div>
      </section>

      {/* Logout */}
      <section className="rounded-3xl bg-red-50 dark:bg-red-950/30 shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.08)] p-5">
        <h2 className="font-semibold mb-2 text-red-600 dark:text-red-400">Logout</h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">
          This will clear all app data including workouts, meals, and progress.
        </p>
        {showLogoutConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-6 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 shadow-[9px_9px_16px_rgba(0,0,0,0.2),-9px_-9px_16px_rgba(255,255,255,0.9)] dark:shadow-[9px_9px_16px_rgba(0,0,0,0.5),-9px_-9px_16px_rgba(255,255,255,0.08)] font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-6 py-2 rounded-full bg-red-600 dark:bg-red-700 shadow-[9px_9px_16px_rgba(0,0,0,0.3),-9px_-9px_16px_rgba(255,255,255,0.5)] dark:shadow-[9px_9px_16px_rgba(0,0,0,0.6),-9px_-9px_16px_rgba(255,255,255,0.08)] text-white font-semibold"
            >
              Confirm Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-6 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 shadow-[9px_9px_16px_rgba(0,0,0,0.2),-9px_-9px_16px_rgba(255,255,255,0.9)] dark:shadow-[9px_9px_16px_rgba(0,0,0,0.5),-9px_-9px_16px_rgba(255,255,255,0.08)] text-red-600 dark:text-red-400 font-semibold"
          >
            Logout
          </button>
        )}
      </section>
    </main>
  );
}
