import { useState, useEffect, useCallback } from "react";
import { getTodayISO, toISODate } from "@/stores/storageV2";

export function useDaySelector(storageKey: string) {
  // Initialize with persisted or today's date
  const [dateISO, setDateISO] = useState<string>(() => {
    if (typeof window === "undefined") return getTodayISO();
    const persisted = localStorage.getItem(storageKey);
    return persisted || getTodayISO();
  });

  // Convert ISO to Date object for formatting
  const dateObj = useCallback(() => {
    const [year, month, day] = dateISO.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [dateISO])();

  // Check if current date is today
  const isToday = dateISO === getTodayISO();

  // Actions
  const goPrevDay = useCallback(() => {
    const date = dateObj;
    date.setDate(date.getDate() - 1);
    const newISO = toISODate(date);
    setDateISO(newISO);
    localStorage.setItem(storageKey, newISO);
  }, [dateObj, storageKey]);

  const goNextDay = useCallback(() => {
    const date = dateObj;
    date.setDate(date.getDate() + 1);
    const newISO = toISODate(date);
    setDateISO(newISO);
    localStorage.setItem(storageKey, newISO);
  }, [dateObj, storageKey]);

  const setDateISOHandler = useCallback((newISO: string) => {
    setDateISO(newISO);
    localStorage.setItem(storageKey, newISO);
  }, [storageKey]);

  return {
    dateISO,
    dateObj,
    isToday,
    goPrevDay,
    goNextDay,
    setDateISO: setDateISOHandler,
  };
}

