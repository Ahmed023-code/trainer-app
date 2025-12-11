'use client'

import { useMemo } from 'react'

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
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      {/* Header with date display */}
      <header className="pt-4">
        <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.05)] p-3">
          <div className="text-center">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {todayObj.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-lg font-semibold">
              {todayObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Weight card */}
      <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)]">
        <div className="p-3">
          <label className="block text-sm font-medium mb-2">Weight</label>

          {/* Saved mode - show weight with checkmark */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.6)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                stroke="currentColor"
                className="w-4 h-4 text-green-600 dark:text-green-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)] px-3 py-1.5 flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {MOCK_WEIGHT.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  lbs
                </span>
              </div>
            </div>

            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Diet summary */}
      <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Diet Summary</h2>
          <button className="tap-target px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-accent-diet text-xs font-semibold">
            Open Diet
          </button>
        </div>

        {/* Layout: Large calorie ring on left, smaller macro rings in 2x2 grid on right */}
        <div className="flex gap-4 items-center">
          {/* Large calorie ring on left */}
          <div className="flex-shrink-0">
            <CalorieRing
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

          {/* Smaller macro rings in 2x2 grid on right */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <SmallMacroRing
              label="Cal"
              current={Math.round(MOCK_DIET.calories)}
              target={MOCK_DIET.goals.cal}
              color="var(--accent-diet)"
            />
            <SmallMacroRing
              label="P"
              current={Math.round(MOCK_DIET.protein)}
              target={MOCK_DIET.goals.p}
              color="#F87171"
            />
            <SmallMacroRing
              label="F"
              current={Math.round(MOCK_DIET.fat)}
              target={MOCK_DIET.goals.f}
              color="#FACC15"
            />
            <SmallMacroRing
              label="C"
              current={Math.round(MOCK_DIET.carbs)}
              target={MOCK_DIET.goals.c}
              color="#60A5FA"
            />
          </div>
        </div>
      </div>

      {/* Workout summary */}
      <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Workout Summary</h2>
          <button className="tap-target px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-[var(--accent-workout)] text-xs font-semibold">
            Open Workout
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center mb-3">
          <div>
            <div className="text-2xl font-bold">{MOCK_WORKOUT.exerciseCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Exercises
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold">{MOCK_WORKOUT.setCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Sets
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-neutral-200/50 dark:border-neutral-700/50">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Body Parts
          </div>
          <div className="text-sm font-medium">{MOCK_WORKOUT.bodyParts}</div>
        </div>
      </div>

      {/* Reminders inbox */}
      <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Inbox</h2>
          <button className="tap-target px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] text-neutral-900 dark:text-neutral-100 text-xs font-semibold">
            + New Reminder
          </button>
        </div>

        <div className="space-y-2">
          {MOCK_REMINDERS.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)]"
            >
              <input
                type="checkbox"
                checked={reminder.done}
                readOnly
                className="mt-0.5 w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-700 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)] border-none text-accent-home dark:text-accent-home checked:bg-accent-home checked:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    reminder.done
                      ? 'line-through text-neutral-400 dark:text-neutral-500'
                      : 'text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  {reminder.title}
                </p>
                {reminder.dueISO && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Due: {new Date(reminder.dueISO).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button className="text-neutral-400 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

// Large calorie ring component
function CalorieRing({
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
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate calories from each macro
  const proteinCals = protein * 4
  const carbsCals = carbs * 4
  const fatCals = fat * 9
  const totalCals = proteinCals + carbsCals + fatCals

  // Calculate percentages of the ring based on caloric contribution
  const proteinPct = totalCals > 0 ? proteinCals / totalCals : 0.33
  const fatPct = totalCals > 0 ? fatCals / totalCals : 0.33
  const carbsPct = totalCals > 0 ? carbsCals / totalCals : 0.34

  // Ring circumference represents consumption relative to goal
  const fillPct = target > 0 ? current / target : 0
  const totalFill = fillPct <= 1 ? circumference * fillPct : circumference

  // Calculate dash lengths for each segment
  const proteinDash = totalFill * proteinPct
  const fatDash = totalFill * fatPct
  const carbsDash = totalFill * carbsPct

  // Check if each macro is over its target
  const proteinOver = protein > proteinTarget
  const carbsOver = carbs > carbsTarget
  const fatOver = fat > fatTarget

  // Calculate segment portions (normal vs overage)
  const getSegmentPortions = (
    curr: number,
    targ: number,
    totalDash: number,
  ) => {
    if (curr <= targ) {
      return { normalDash: totalDash, overageDash: 0 }
    }
    const normalPortion = targ / curr
    const normalDash = totalDash * normalPortion
    const overageDash = totalDash - normalDash
    return { normalDash, overageDash }
  }

  const proteinPortions = getSegmentPortions(
    protein,
    proteinTarget,
    proteinDash,
  )
  const fatPortions = getSegmentPortions(fat, fatTarget, fatDash)
  const carbsPortions = getSegmentPortions(carbs, carbsTarget, carbsDash)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] w-full h-full"
      >
        {/* Define stripe patterns for overage */}
        <defs>
          <pattern
            id="stripe-protein-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect
              width="1.5"
              height="3"
              fill="currentColor"
              className="text-white dark:text-black"
              opacity="0.5"
            />
          </pattern>
          <pattern
            id="stripe-fat-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect
              width="1.5"
              height="3"
              fill="currentColor"
              className="text-white dark:text-black"
              opacity="0.5"
            />
          </pattern>
          <pattern
            id="stripe-carbs-home"
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
            patternTransform="rotate(45)"
          >
            <rect
              width="1.5"
              height="3"
              fill="currentColor"
              className="text-white dark:text-black"
              opacity="0.5"
            />
          </pattern>
        </defs>

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

        {/* Protein segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F87171"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${proteinPortions.normalDash} ${
            circumference - proteinPortions.normalDash
          }`}
          strokeDashoffset="0"
          fill="none"
        />
        {/* Protein segment - overage portion */}
        {proteinOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#B84444"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${proteinPortions.overageDash} ${
                circumference - proteinPortions.overageDash
              }`}
              strokeDashoffset={-proteinPortions.normalDash}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-protein-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${proteinPortions.overageDash} ${
                circumference - proteinPortions.overageDash
              }`}
              strokeDashoffset={-proteinPortions.normalDash}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        {/* Fat segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FACC15"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${fatPortions.normalDash} ${
            circumference - fatPortions.normalDash
          }`}
          strokeDashoffset={-proteinDash}
          fill="none"
        />
        {/* Fat segment - overage portion */}
        {fatOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#C9A000"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatPortions.overageDash} ${
                circumference - fatPortions.overageDash
              }`}
              strokeDashoffset={-(proteinDash + fatPortions.normalDash)}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-fat-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${fatPortions.overageDash} ${
                circumference - fatPortions.overageDash
              }`}
              strokeDashoffset={-(proteinDash + fatPortions.normalDash)}
              fill="none"
              opacity="0.6"
            />
          </g>
        )}

        {/* Carbs segment - normal portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#60A5FA"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${carbsPortions.normalDash} ${
            circumference - carbsPortions.normalDash
          }`}
          strokeDashoffset={-(proteinDash + fatDash)}
          fill="none"
        />
        {/* Carbs segment - overage portion */}
        {carbsOver && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3D7BC7"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsPortions.overageDash} ${
                circumference - carbsPortions.overageDash
              }`}
              strokeDashoffset={
                -(proteinDash + fatDash + carbsPortions.normalDash)
              }
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#stripe-carbs-home)"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${carbsPortions.overageDash} ${
                circumference - carbsPortions.overageDash
              }`}
              strokeDashoffset={
                -(proteinDash + fatDash + carbsPortions.normalDash)
              }
              fill="none"
              opacity="0.6"
            />
          </g>
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {current}
        </div>
        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
          of {target}
        </div>
        <div className="text-[8px] text-neutral-400 dark:text-neutral-500">
          kcal
        </div>
      </div>
    </div>
  )
}

// Small macro ring component for the 2x2 grid
function SmallMacroRing({
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
  const size = 70
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  // Allow ring to go beyond 100%, cap at 150% for visual display
  const pct = Math.max(0, Math.min(1.5, target > 0 ? current / target : 0))
  const dash = circumference * pct

  // Track if we're at or below 100%
  const normalPct = Math.min(1, target > 0 ? current / target : 0)
  const normalDash = circumference * normalPct

  // Calculate difference
  const diff = current - target
  const isOver = diff > 0
  const isUnder = diff < 0

  // Get background color based on label
  const getBgColor = () => {
    if (label === 'Cal') return '#34D3991F'
    if (label === 'P') return '#F871711F'
    if (label === 'F') return '#FACC151F'
    if (label === 'C') return '#60A5FA1F'
    return `${color}22`
  }

  // Get darker color for overage
  const getOverageColor = () => {
    if (label === 'Cal') return '#1F9D6D'
    if (label === 'P') return '#B84444'
    if (label === 'F') return '#C9A000'
    if (label === 'C') return '#3D7BC7'
    return color
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 rotate-[-90deg] w-full h-full"
        >
          {/* Define stripe pattern for overage */}
          <defs>
            <pattern
              id={`stripe-${label}-small`}
              patternUnits="userSpaceOnUse"
              width="3"
              height="3"
              patternTransform="rotate(45)"
            >
              <rect
                width="1.5"
                height="3"
                fill="currentColor"
                className="text-white dark:text-black"
                opacity="0.5"
              />
            </pattern>
          </defs>

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

          {/* Base progress ring - shows up to 100% */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${normalDash} ${circumference - normalDash}`}
            fill="none"
          />

          {/* Overage portion - shows amount beyond 100% */}
          {current > target && (
            <g>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={getOverageColor()}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${
                  circumference - (dash - normalDash)
                }`}
                strokeDashoffset={-normalDash}
                fill="none"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#stripe-${label}-small)`}
                strokeWidth={stroke}
                strokeLinecap="butt"
                strokeDasharray={`${dash - normalDash} ${
                  circumference - (dash - normalDash)
                }`}
                strokeDashoffset={-normalDash}
                fill="none"
                opacity="0.6"
              />
            </g>
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="inline-grid place-items-center rounded-full font-extrabold text-[9px] leading-none"
            style={{
              width: 18,
              height: 18,
              backgroundColor: color,
              color: '#000',
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Value bubble under ring */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums whitespace-nowrap"
          style={{
            backgroundColor: getBgColor(),
            color: color,
          }}
        >
          {current}/{target}
        </span>
        {/* Difference indicator */}
        {diff !== 0 && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold gap-0.5"
            style={{
              backgroundColor: color,
              color: '#000',
            }}
          >
            <span className="text-[11px] font-black">{isOver ? '▲' : '▼'}</span>{' '}
            {Math.abs(Math.round(diff))}
            {label === 'Cal' ? 'cal' : 'g'}
          </span>
        )}
      </div>
    </div>
  )
}
