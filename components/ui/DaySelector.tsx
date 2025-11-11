"use client";

import { useState, useEffect, useRef } from "react";
import { toISODate } from "@/stores/storageV2";

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

// Calendar picker component
function CalendarPicker({
  selectedDate,
  onSelectDate,
  onClose,
}: {
  selectedDate: Date;
  onSelectDate: (dateISO: string) => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(viewMonth);
  const monthName = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const goToPrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    onSelectDate(toISODate(date));
    onClose();
  };

  const isSelectedDate = (date: Date) => {
    return toISODate(date) === toISODate(selectedDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div
      ref={calendarRef}
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-4"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Previous month"
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

        <h3 className="text-sm font-semibold">{monthName}</h3>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Next month"
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
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const selected = isSelectedDate(day);
          const today = isToday(day);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                selected
                  ? "bg-accent-diet text-white"
                  : today
                  ? "bg-neutral-200 dark:bg-neutral-700"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  const handleDateSelect = (selectedISO: string) => {
    onSelect(selectedISO);
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
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-center font-medium flex items-center justify-center gap-2"
            >
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              {formatted}
            </button>

            {showPicker && (
              <CalendarPicker
                selectedDate={dateObj}
                onSelectDate={handleDateSelect}
                onClose={() => setShowPicker(false)}
              />
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
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-center font-medium flex items-center justify-center gap-2"
          >
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
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            {formatted}
          </button>

          {showPicker && (
            <CalendarPicker
              selectedDate={dateObj}
              onSelectDate={handleDateSelect}
              onClose={() => setShowPicker(false)}
            />
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

