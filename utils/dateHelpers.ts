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

export const get3MonthsMatrices = (anchorISO: string): { month: string; matrix: (string | null)[][] }[] => {
  const [year, month] = anchorISO.split("-").map(Number);
  const matrices: { month: string; matrix: (string | null)[][] }[] = [];

  // Generate matrices for current month and 2 months before
  for (let i = 2; i >= 0; i--) {
    const targetDate = new Date(year, month - 1 - i, 1);
    const targetISO = toISODate(targetDate);
    const matrix = getMonthMatrix(targetISO);
    const monthName = targetDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    matrices.push({ month: monthName, matrix });
  }

  return matrices;
};

export const getMonthMatrix = (anchorISO: string): (string | null)[][] => {
  const [year, month] = anchorISO.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // Last day of the month
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const matrix: (string | null)[][] = [];
  const current = new Date(startDate);

  // Calculate how many weeks we need (stop when we've passed the last day of the month)
  while (true) {
    const row: (string | null)[] = [];
    let hasMonthDays = false;

    for (let day = 0; day < 7; day++) {
      // Check both month AND year to handle year boundaries correctly
      if (current.getMonth() + 1 === month && current.getFullYear() === year) {
        row.push(toISODate(current));
        hasMonthDays = true;
      } else {
        row.push(null);
      }
      current.setDate(current.getDate() + 1);
    }

    matrix.push(row);

    // Stop if this week had no days from the target month and we've already started
    if (!hasMonthDays && matrix.length > 1) {
      break;
    }

    // Safety check: don't go beyond 6 weeks
    if (matrix.length >= 6) {
      break;
    }
  }

  return matrix;
};

export type ViewType = "day" | "week" | "month" | "3months" | "year";

export const shiftPeriod = (view: ViewType, direction: 1 | -1, anchorISO: string): string => {
  const [year, month, day] = anchorISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (view === "day") {
    date.setDate(date.getDate() + direction);
  } else if (view === "week") {
    date.setDate(date.getDate() + (direction * 7));
  } else if (view === "month") {
    date.setMonth(date.getMonth() + direction);
  } else if (view === "3months") {
    // Shift by 1 month at a time for 3-month view
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
  } else if (view === "3months") {
    const [year, month] = dateISO.split("-").map(Number);
    const endMonth = new Date(year, month - 1); // Current month
    const startMonth = new Date(year, month - 1);
    startMonth.setMonth(startMonth.getMonth() - 2); // 2 months before
    return `${startMonth.toLocaleDateString(undefined, { month: "short" })}–${endMonth.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  } else {
    return dateISO.split("-")[0];
  }
};
