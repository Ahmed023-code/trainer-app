import { toISODate } from "@/stores/storageV2";

export const getWeekRange = (anchorISO: string): { start: string; end: string; dates: string[] } => {
  const [year, month, day] = anchorISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const dates: string[] = [];
  const current = new Date(start);
  for (let i = 0; i < 7; i++) {
    dates.push(toISODate(current));
    current.setDate(current.getDate() + 1);
  }

  return {
    start: toISODate(start),
    end: toISODate(end),
    dates
  };
};

export const getMonthMatrix = (anchorISO: string): (string | null)[][] => {
  const [year, month] = anchorISO.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const matrix: (string | null)[][] = [];
  const current = new Date(startDate);

  for (let week = 0; week < 6; week++) {
    const row: (string | null)[] = [];
    for (let day = 0; day < 7; day++) {
      if (current.getMonth() + 1 === month) {
        row.push(toISODate(current));
      } else {
        row.push(null);
      }
      current.setDate(current.getDate() + 1);
    }
    matrix.push(row);
  }

  return matrix;
};

export type ViewType = "day" | "week" | "month" | "year";

export const shiftPeriod = (view: ViewType, direction: 1 | -1, anchorISO: string): string => {
  const [year, month, day] = anchorISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (view === "day") {
    date.setDate(date.getDate() + direction);
  } else if (view === "week") {
    date.setDate(date.getDate() + (direction * 7));
  } else if (view === "month") {
    date.setMonth(date.getMonth() + direction);
  } else if (view === "year") {
    date.setFullYear(date.getFullYear() + direction);
  }

  return toISODate(date);
};

export const formatPeriodLabel = (view: ViewType, dateISO: string, dateObj: Date): string => {
  if (view === "day") {
    return dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } else if (view === "week") {
    const range = getWeekRange(dateISO);
    const start = new Date(range.start);
    const end = new Date(range.end);
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}–${end.toLocaleDateString(undefined, { day: "numeric", year: "numeric" })}`;
  } else if (view === "month") {
    return dateObj.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } else {
    return dateISO.split("-")[0];
  }
};
