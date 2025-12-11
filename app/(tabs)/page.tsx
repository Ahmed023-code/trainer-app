"use client";

import { useMemo } from "react";

// Mock data constants
const MOCK_WEIGHT = 185.5
const MOCK_WEIGHT_HISTORY = [183.0, 183.5, 184.0, 184.5, 185.0, 185.2, 185.5]
const MOCK_TODAY = new Date().toISOString().split('T')[0]
const MOCK_DIET = {
  calories: 1850,
  protein: 145,
  carbs: 180,
  fat: 55,
  goals: { cal: 2400, p: 180, c: 240, f: 70 },
}
const MOCK_WORKOUT = {
  exerciseCount: 5,
  setCount: 18,
  bodyParts: 'Chest & Triceps',
}
const MOCK_REMINDERS = [
  { id: '1', title: 'Buy protein powder', done: false, dueISO: null },
  { id: '2', title: 'Schedule trainer session', done: true, dueISO: '2025-12-15' },
]

export default function HomePage() {
  const todayObj = useMemo(() => new Date(MOCK_TODAY + 'T00:00:00'), [])

  return (
    <main className="mx-auto w-full max-w-[520px] px-4 sm:px-6 pb-[calc(env(safe-area-inset-bottom)+96px)] space-y-5">
      {/* Header with M3 Typography */}
      <header className="pt-6">
        <div className="m3-card bg-neutral-100 dark:bg-neutral-900 p-6">
          <h1 className="m3-headline-small font-semibold">
            {todayObj.toLocaleDateString('en-US', { weekday: 'long' })}
          </h1>
          <p className="m3-title-medium text-neutral-600 dark:text-neutral-400 mt-1">
            {todayObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Weight Card - M3 Filled Card */}
      <section className="m3-card-filled bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="m3-title-large font-semibold">Weight</h2>
          <div className="w-10 h-10 m3-elevation-1 rounded-full bg-accent-home/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-accent-home">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.589-1.202L5.25 4.971z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <div className="m3-display-small font-bold text-accent-home">{MOCK_WEIGHT}</div>
          <div className="m3-label-large text-neutral-600 dark:text-neutral-400">lbs</div>
        </div>
        <div className="mt-4 m3-surface-inset rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-3">
          <div className="m3-label-medium text-neutral-500 dark:text-neutral-400 text-center">
            Last logged: Today at 8:30 AM
          </div>
        </div>
      </section>

      {/* Diet Summary - M3 Card with Rings */}
      <section className="m3-card-filled bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="m3-title-large font-semibold">Diet Summary</h2>
          <button className="m3-btn-text px-4 py-2 text-accent-diet">
            Open →
          </button>
        </div>

        <div className="flex gap-5 items-center">
          {/* Large M3 Calorie Ring */}
          <div className="flex-shrink-0">
            <M3CalorieRing
              current={Math.round(MOCK_DIET.calories)}
              target={MOCK_DIET.goals.cal}
              protein={Math.round(MOCK_DIET.protein)}
              carbs={Math.round(MOCK_DIET.carbs)}
              fat={Math.round(MOCK_DIET.fat)}
              proteinTarget={MOCK_DIET.goals.p}
              carbsTarget={MOCK_DIET.goals.c}
              fatTarget={MOCK_DIET.goals.f}
            />
          </div>

          {/* M3 Macro Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <M3MacroCard
              label="Cal"
              current={Math.round(MOCK_DIET.calories)}
              target={MOCK_DIET.goals.cal}
              color="var(--accent-diet)"
            />
            <M3MacroCard
              label="P"
              current={Math.round(MOCK_DIET.protein)}
              target={MOCK_DIET.goals.p}
              color="#F87171"
            />
            <M3MacroCard
              label="F"
              current={Math.round(MOCK_DIET.fat)}
              target={MOCK_DIET.goals.f}
              color="#FACC15"
            />
            <M3MacroCard
              label="C"
              current={Math.round(MOCK_DIET.carbs)}
              target={MOCK_DIET.goals.c}
              color="#60A5FA"
            />
          </div>
        </div>
      </section>

      {/* Workout Summary - M3 Card */}
      <section className="m3-card-filled bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="m3-title-large font-semibold">Workout Summary</h2>
          <button className="m3-btn-text px-4 py-2 text-[var(--accent-workout)]">
            Open →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="m3-surface-inset rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-5 text-center">
            <div className="m3-display-small font-bold text-[var(--accent-workout)]">{MOCK_WORKOUT.exerciseCount}</div>
            <div className="m3-label-large text-neutral-600 dark:text-neutral-400 mt-1">Exercises</div>
          </div>
          <div className="m3-surface-inset rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-5 text-center">
            <div className="m3-display-small font-bold text-[var(--accent-workout)]">{MOCK_WORKOUT.setCount}</div>
            <div className="m3-label-large text-neutral-600 dark:text-neutral-400 mt-1">Sets</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-300/30 dark:border-neutral-700/30">
          <div className="m3-label-medium text-neutral-500 dark:text-neutral-400 mb-1">Body Parts</div>
          <div className="m3-body-large font-medium">{MOCK_WORKOUT.bodyParts}</div>
        </div>
      </section>

      {/* Reminders - M3 Card */}
      <section className="m3-card-filled bg-neutral-100 dark:bg-neutral-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="m3-title-large font-semibold">Inbox</h2>
          <button className="m3-btn-filled bg-neutral-200 dark:bg-neutral-800 px-4 py-2">
            <span className="m3-label-large">+ New</span>
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_REMINDERS.map((reminder) => (
            <div
              key={reminder.id}
              className="m3-surface-inset rounded-2xl bg-neutral-100 dark:bg-neutral-900 p-4 flex items-start gap-3"
            >
              <input
                type="checkbox"
                checked={reminder.done}
                readOnly
                className="mt-0.5 w-5 h-5 rounded-md m3-elevation-1 border-none text-accent-home checked:bg-accent-home"
              />
              <div className="flex-1">
                <p className={`m3-body-medium font-medium ${reminder.done ? 'line-through text-neutral-400' : ''}`}>
                  {reminder.title}
                </p>
                {reminder.dueISO && (
                  <p className="m3-label-small text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Due: {new Date(reminder.dueISO).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* M3 FAB */}
      <div className="fixed right-6 bottom-24 z-[9500]">
        <button className="m3-fab bg-accent-home text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </main>
  );
}

// M3 Calorie Ring with Neomorphism
function M3CalorieRing({
  current,
  target,
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: {
  current: number
  target: number
  protein: number
  carbs: number
  fat: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
}) {
  const size = 140
  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const proteinCals = protein * 4
  const carbsCals = carbs * 4
  const fatCals = fat * 9
  const totalCals = proteinCals + carbsCals + fatCals

  const proteinPct = totalCals > 0 ? proteinCals / totalCals : 0.33
  const fatPct = totalCals > 0 ? fatCals / totalCals : 0.33
  const carbsPct = totalCals > 0 ? carbsCals / totalCals : 0.34

  const fillPct = target > 0 ? current / target : 0
  const totalFill = fillPct <= 1 ? circumference * fillPct : circumference

  const proteinDash = totalFill * proteinPct
  const fatDash = totalFill * fatPct
  const carbsDash = totalFill * carbsPct

  return (
    <div className="relative m3-elevation-1 rounded-full bg-neutral-100 dark:bg-neutral-900 p-3" style={{ width: size + 24, height: size + 24 }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] w-full h-full">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={stroke}
          fill="none"
          className="text-neutral-400 dark:text-neutral-600"
        />

        {/* Protein segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F87171"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${proteinDash} ${circumference - proteinDash}`}
          fill="none"
        />

        {/* Fat segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FACC15"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${fatDash} ${circumference - fatDash}`}
          strokeDashoffset={-proteinDash}
          fill="none"
        />

        {/* Carbs segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#60A5FA"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${carbsDash} ${circumference - carbsDash}`}
          strokeDashoffset={-(proteinDash + fatDash)}
          fill="none"
        />
      </svg>

      {/* Center content with M3 typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="m3-headline-small font-bold">{current}</div>
        <div className="m3-label-small text-neutral-500 dark:text-neutral-400">of {target}</div>
        <div className="m3-label-small text-neutral-400 dark:text-neutral-500">kcal</div>
      </div>
    </div>
  )
}

// M3 Macro Card with Circular Progress
function M3MacroCard({
  label,
  current,
  target,
  color,
}: {
  label: string
  current: number
  target: number
  color: string
}) {
  const size = 60
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, target > 0 ? current / target : 0))
  const dash = circumference * pct

  return (
    <div className="m3-surface-inset rounded-2xl bg-neutral-100 dark:bg-neutral-900 p-3 flex flex-col items-center">
      <div className="relative mb-2" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth={stroke}
            fill="none"
            className="text-neutral-400 dark:text-neutral-600"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="m3-label-large font-bold" style={{ color }}>{label}</span>
        </div>
      </div>
      <div className="m3-body-medium font-bold">{current}</div>
      <div className="m3-label-small text-neutral-500 dark:text-neutral-400">of {target}</div>
    </div>
  )
}
