"use client";

const mockPreferences = [
  { title: "Profile", description: "Name, avatar, and timezone", status: "Preview" },
  { title: "Notifications", description: "Quiet hours and reminders", status: "Muted" },
  { title: "Units", description: "Imperial · Pounds", status: "Mock" },
];

const mockAppearance = [
  { title: "Theme", detail: "Auto (system)", badge: "UI only" },
  { title: "Accent", detail: "Per-tab colors", badge: "Mock data" },
  { title: "Typography", detail: "Inter · 16px base", badge: "Preview" },
];

export default function SettingsPage() {
  return (
    <main className="space-y-6 pt-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Settings</p>
        <h1 className="text-3xl font-semibold">Design Sandbox</h1>
        <p className="text-sm text-neutral-500">Static cards to test spacing, color, and typography.</p>
      </header>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Preferences</h2>
          <span className="text-xs rounded-full bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-neutral-600 dark:text-neutral-300">Mock</span>
        </div>
        <div className="space-y-2">
          {mockPreferences.map((pref) => (
            <div
              key={pref.title}
              className="flex items-center justify-between rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-3"
            >
              <div>
                <p className="font-medium">{pref.title}</p>
                <p className="text-xs text-neutral-500">{pref.description}</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                {pref.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <span className="text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1">Design</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {mockAppearance.map((item) => (
            <div key={item.title} className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-3 space-y-1">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-neutral-500">{item.detail}</p>
              <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-200">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <h2 className="text-xl font-semibold">Notes</h2>
        <p className="mt-2 text-sm text-neutral-500">
          This branch is stripped down to tab navigation and mocked surface data so UI experiments can ship quickly without
          touching live features.
        </p>
      </section>
    </main>
  );
}
