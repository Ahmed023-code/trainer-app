"use client";

import { useState } from "react";

type DaySelectorProps = {
  dateISO: string;
  dateObj: Date;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (dateISO: string) => void;
  isToday: boolean;
  onGoToToday?: () => void; // Optional Go to Today button
  accentColor?: string; // Optional accent color for Today button
  showNavigation?: boolean; // Optional flag to hide navigation arrows (for Home tab)
  hasSettingsButton?: boolean; // Reserve space for settings button on right
  fullWidthLayout?: boolean; // New layout: date above full-width Today button
};

export default function DaySelector({
  dateISO,
  dateObj,
  onPrev,
  onNext,
  onSelect,
  isToday,
  onGoToToday,
  accentColor = "var(--accent-diet)",
  showNavigation = true,
  hasSettingsButton = false,
  fullWidthLayout = false
}: DaySelectorProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Format: Mon, Oct 27, 2025
  const formatted = dateObj.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Get input value in YYYY-MM-DD format for native date picker
  const inputValue = dateISO;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    if (selected) {
      onSelect(selected);
    }
    setShowPicker(false);
  };

  // Full-width layout: date above, full-width Today button below
  if (fullWidthLayout && onGoToToday) {
    return (
      <div className="space-y-3">
        {/* Date display centered above */}
        <div className="flex items-center justify-center gap-2">
          {showNavigation && (
            <button
              onClick={onPrev}
              className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Previous day"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          <div className="flex-1 relative">
            {showPicker ? (
              <input
                type="date"
                value={inputValue}
                onChange={handleDateChange}
                onBlur={() => setShowPicker(false)}
                className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center font-medium"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-center font-medium"
              >
                {formatted}
              </button>
            )}
          </div>

          {showNavigation && (
            <button
              onClick={onNext}
              className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Next day"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Full-width Today button */}
        <button
          onClick={onGoToToday}
          className={`w-full px-4 py-3 rounded-full text-base font-medium transition-colors ${
            isToday
              ? `text-white border-transparent`
              : "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          }`}
          style={isToday ? { backgroundColor: accentColor } : undefined}
          aria-label="Go to today"
        >
          {isToday ? "Today" : "Go to Today"}
        </button>
      </div>
    );
  }

  // Original layout
  return (
    <div className={hasSettingsButton ? "pr-14" : ""}>
      <div className="flex items-center gap-2">
        {/* Left chevron - conditionally rendered */}
        {showNavigation && (
          <button
            onClick={onPrev}
            className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Previous day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        {/* Center date button with picker */}
        <div className="flex-1 relative">
          {showPicker ? (
            <input
              type="date"
              value={inputValue}
              onChange={handleDateChange}
              onBlur={() => setShowPicker(false)}
              className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center font-medium"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-center font-medium"
            >
              {formatted}
            </button>
          )}
          {isToday && !onGoToToday && (
            <div className="absolute -top-1 -right-1">
              <span className="px-1.5 py-0.5 text-xs bg-[#34D399] text-black rounded-full">Today</span>
            </div>
          )}
        </div>

        {/* Right chevron - conditionally rendered */}
        {showNavigation && (
          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Next day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Optional Go to Today button */}
      {onGoToToday && (
        <div className="mt-2">
          <button
            onClick={onGoToToday}
            className={`w-full px-3 py-2 rounded-full border text-sm font-medium transition-colors ${
              isToday
                ? `text-white border-transparent`
                : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
            style={isToday ? { backgroundColor: accentColor } : undefined}
            aria-label="Go to today"
          >
            {isToday ? "Today" : "Go to Today"}
          </button>
        </div>
      )}
    </div>
  );
}

