"use client";

const mockSessions = [
  {
    title: "Upper Push",
    duration: "62 min",
    status: "Planned",
    focus: "Chest · Shoulders · Triceps",
    blocks: [
      "Barbell Bench · 4 x 10 @ 155 lb",
      "Incline DB Press · 3 x 12 @ 55 lb",
      "Seated Shoulder Press · 3 x 10 @ 75 lb",
      "Tricep Dips · 3 x 12"
    ],
  },
  {
    title: "Lower Power",
    duration: "58 min",
    status: "Queued",
    focus: "Quads · Glutes · Hamstrings",
    blocks: [
      "Back Squat · 4 x 8 @ 225 lb",
      "Romanian Deadlift · 3 x 10 @ 185 lb",
      "Leg Press · 3 x 12",
      "Walking Lunge · 2 x 20 steps"
    ],
  },
  {
    title: "Conditioning",
    duration: "35 min",
    status: "Finished",
    focus: "Engine · Core",
    blocks: [
      "AirBike · 4 x 3:00 @ sustainable",
      "Kettlebell Swing · 3 x 20",
      "Plank Variations · 10:00 total",
    ],
  },
];

export default function WorkoutPage() {
  return (
    <main className="space-y-6 pt-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Workout</p>
        <h1 className="text-3xl font-semibold">Session Gallery</h1>
        <p className="text-sm text-neutral-500">Static sessions for layout and color testing.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {mockSessions.map((session) => (
          <article
            key={session.title}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">{session.status}</p>
                <h2 className="text-lg font-semibold">{session.title}</h2>
                <p className="text-sm text-neutral-500">{session.focus}</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                {session.duration}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {session.blocks.map((block) => (
                <div key={block} className="flex items-start gap-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 px-3 py-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <p>{block}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <p>Mock data only</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Volume</span>
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">Tempo</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
