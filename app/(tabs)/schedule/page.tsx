"use client";

const mockProgress = [
  { label: "Workouts this week", value: "4 / 5", accent: "bg-purple-500" },
  { label: "Daily steps", value: "8,400", accent: "bg-blue-500" },
  { label: "Sleep quality", value: "7.8 / 10", accent: "bg-amber-500" },
];

const mockTimeline = [
  { day: "Mon", focus: "Push", notes: "Bench + Accessory", badge: "Complete" },
  { day: "Tue", focus: "Pull", notes: "Rows + Grip", badge: "Complete" },
  { day: "Wed", focus: "Rest", notes: "Mobility + Walk", badge: "Active" },
  { day: "Thu", focus: "Lower", notes: "Squat + Hinge", badge: "Planned" },
  { day: "Fri", focus: "Conditioning", notes: "Bike + Core", badge: "Planned" },
];

const mockMilestones = [
  { title: "Consistent logging", detail: "7-day streak", tag: "UI badge" },
  { title: "Protein on target", detail: "5 / 7 days", tag: "Mock data" },
  { title: "Hydration", detail: "3L average", tag: "Design only" },
];

export default function SchedulePage() {
  return (
    <main className="space-y-6 pt-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Progress</p>
        <h1 className="text-3xl font-semibold">Weekly Snapshot</h1>
        <p className="text-sm text-neutral-500">Static timeline to validate layout ideas.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {mockProgress.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4"
          >
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${item.accent}`} />
              <p className="text-sm text-neutral-500">{item.label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <span className="text-xs rounded-full bg-neutral-200 dark:bg-neutral-800 px-3 py-1 text-neutral-600 dark:text-neutral-300">Static</span>
        </div>
        <div className="space-y-2">
          {mockTimeline.map((item) => (
            <div key={item.day} className="flex items-center justify-between rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-semibold">
                  {item.day}
                </div>
                <div>
                  <p className="font-medium">{item.focus}</p>
                  <p className="text-xs text-neutral-500">{item.notes}</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Milestones</h2>
          <span className="text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1">Decorative</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {mockMilestones.map((milestone) => (
            <div key={milestone.title} className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
              <p className="text-sm font-semibold">{milestone.title}</p>
              <p className="text-xs text-neutral-500">{milestone.detail}</p>
              <span className="mt-2 inline-block text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-200">
                {milestone.tag}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
