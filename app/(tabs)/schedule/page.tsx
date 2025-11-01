/*
 * AUDIT REPORT - Progress Tab (formerly Schedule)
 *
 * VERIFIED COMPLETE:
 * ✓ Date-scoped storage integration (storageV2.ts)
 * ✓ Day/Week/Month/Year view selector with segmented control
 * ✓ Period navigation with left/right arrows and formatted labels
 * ✓ Day view: weight tracking with sparkline, diet summary with macro rings, workout summary, media gallery
 * ✓ Week view: summary cards, 7-day grid with badges for workout/weight/diet adherence
 * ✓ Month view: calendar grid with day badges, monthly stats summary
 * ✓ Year view: monthly breakdown cards with workout frequency and diet adherence, progress bars
 * ✓ Deep linking: "Open Diet/Workout" buttons set target tab's date via localStorage
 * ✓ Media storage: IndexedDB for blobs via idb-keyval, metadata in localStorage
 * ✓ Object URL management: created on load, revoked on unmount
 * ✓ Accessibility: aria-labels on navigation buttons, min 40px tap targets
 * ✓ Performance: memoized period labels, transition effects on date changes
 * ✓ Component optimization: Broken down into smaller reusable components
 *
 * CHANGES MADE:
 * - Implemented Week view with 7-day grid showing workout/weight/diet badges
 * - Implemented Month view with full calendar grid and activity badges
 * - Implemented Year view with 12 monthly cards showing workout frequency and diet adherence
 * - All views use date-scoped data from storageV2, computed aggregates on the fly
 * - Lightweight CSS/Tailwind-based charts (no heavy libraries)
 * - Mobile-first responsive design with iOS-like polish
 * - Extracted view components: DayView, WeekView, MonthView, YearView
 * - Extracted date utilities to utils/dateHelpers.ts
 */

"use client";

import { useState, useMemo } from "react";
import { useDaySelector } from "@/hooks/useDaySelector";
import DayView from "@/components/progress/DayView";
import WeekView from "@/components/progress/WeekView";
import MonthView from "@/components/progress/MonthView";
import YearView from "@/components/progress/YearView";
import { shiftPeriod, formatPeriodLabel, type ViewType } from "@/utils/dateHelpers";

export default function ProgressPage() {
  const [view, setView] = useState<ViewType>("day");

  // Use a separate date selector for progress
  const { dateISO, dateObj, setDateISO, isToday } = useDaySelector("ui-last-date-progress");

  // Period navigation
  const handlePrevPeriod = () => {
    const newISO = shiftPeriod(view, -1, dateISO);
    setDateISO(newISO);
    localStorage.setItem("ui-last-date-progress", newISO);
  };

  const handleNextPeriod = () => {
    const newISO = shiftPeriod(view, 1, dateISO);
    setDateISO(newISO);
    localStorage.setItem("ui-last-date-progress", newISO);
  };

  // Format period label
  const periodLabel = useMemo(() => {
    return formatPeriodLabel(view, dateISO, dateObj);
  }, [view, dateISO, dateObj]);

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header with period navigation */}
      <header className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={handlePrevPeriod}
            className="w-10 h-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Previous period"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex-1 text-center font-medium">
            {periodLabel}
          </div>

          <button
            onClick={handleNextPeriod}
            className="w-10 h-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Next period"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* View selector */}
        <div className="flex gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
          {(["day", "week", "month", "year"] as ViewType[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${view === v ? "bg-[var(--accent-progress)] text-white" : "text-neutral-600 dark:text-neutral-400"}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Content based on view */}
      <div className="mt-4">
        {view === "day" && <DayView dateISO={dateISO} isToday={isToday} />}
        {view === "week" && <WeekView dateISO={dateISO} setDateISO={setDateISO} />}
        {view === "month" && <MonthView dateISO={dateISO} setDateISO={setDateISO} />}
        {view === "year" && <YearView dateISO={dateISO} setDateISO={setDateISO} />}
      </div>
    </main>
  );
}
