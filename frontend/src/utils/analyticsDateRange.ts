import type { AcademicYearResponse } from "./responses";
import { formatDateInput } from "./date";

const DAY_MS = 86_400_000;

export type AnalyticsRange = "week" | "month" | "school-term" | "academic-year";

export const ANALYTICS_RANGE_OPTIONS: Array<{
  value: AnalyticsRange;
  label: string;
}> = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "school-term", label: "School term" },
  { value: "academic-year", label: "Academic year" },
];

type DateWindow = {
  from: string;
  to: string;
  label: string;
};

type LocalRangeOptions = {
  academicYear?: AcademicYearResponse | null;
  today?: Date;
};

export function getAnalyticsDateWindow(
  range: AnalyticsRange,
  options: LocalRangeOptions = {}
): DateWindow {
  const today = toStartOfDay(options.today ?? new Date());

  if (range === "week") {
    const from = startOfWeekMonday(today);
    return {
      from: formatDateInput(from),
      to: formatDateInput(today),
      label: "Week to date",
    };
  }

  if (range === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: formatDateInput(from),
      to: formatDateInput(today),
      label: "Month to date",
    };
  }

  const academicYearBounds = getAcademicYearBounds(options.academicYear, today);

  if (range === "academic-year") {
    const end = minDate(today, academicYearBounds.end);
    const label = options.academicYear?.name
      ? `Academic year (${options.academicYear.name})`
      : "Academic year";
    return {
      from: formatDateInput(academicYearBounds.start),
      to: formatDateInput(end),
      label,
    };
  }

  const currentTerm = getCurrentUkSchoolTerm(today, academicYearBounds);
  return {
    from: formatDateInput(currentTerm.start),
    to: formatDateInput(minDate(today, currentTerm.end)),
    label: `${currentTerm.name} term`,
  };
}

function getAcademicYearBounds(
  academicYear: AcademicYearResponse | null | undefined,
  today: Date
) {
  const fallback = inferAcademicYear(today);

  if (!academicYear) return fallback;

  const start = parseLocalDateInput(academicYear.startsOn) ?? fallback.start;
  const end = parseLocalDateInput(academicYear.endsOn) ?? fallback.end;
  return {
    start: minDate(start, end),
    end: maxDate(start, end),
  };
}

function inferAcademicYear(today: Date) {
  const startsThisYear = today.getMonth() >= 8;
  const startYear = startsThisYear ? today.getFullYear() : today.getFullYear() - 1;
  return {
    start: new Date(startYear, 8, 1),
    end: new Date(startYear + 1, 7, 31),
  };
}

function getCurrentUkSchoolTerm(
  today: Date,
  bounds: { start: Date; end: Date }
): { name: "Autumn" | "Spring" | "Summer"; start: Date; end: Date } {
  const clampedToday = clampDate(today, bounds.start, bounds.end);
  const startYear = bounds.start.getFullYear();

  const autumn = {
    name: "Autumn" as const,
    start: bounds.start,
    end: minDate(new Date(startYear, 11, 31), bounds.end),
  };

  const spring = {
    name: "Spring" as const,
    start: maxDate(new Date(startYear + 1, 0, 1), bounds.start),
    end: minDate(new Date(startYear + 1, 2, 31), bounds.end),
  };

  const summer = {
    name: "Summer" as const,
    start: maxDate(new Date(startYear + 1, 3, 1), bounds.start),
    end: bounds.end,
  };

  if (clampedToday.getTime() <= autumn.end.getTime()) {
    return autumn;
  }
  if (clampedToday.getTime() <= spring.end.getTime()) {
    return spring;
  }
  return summer;
}

function parseLocalDateInput(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return toStartOfDay(parsed);
}

function toStartOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeekMonday(date: Date) {
  const value = new Date(date);
  const dayFromMonday = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - dayFromMonday);
  return value;
}

function clampDate(value: Date, min: Date, max: Date) {
  if (value.getTime() < min.getTime()) return new Date(min);
  if (value.getTime() > max.getTime()) return new Date(max);
  return new Date(value);
}

function minDate(first: Date, second: Date) {
  return first.getTime() <= second.getTime() ? new Date(first) : new Date(second);
}

function maxDate(first: Date, second: Date) {
  return first.getTime() >= second.getTime() ? new Date(first) : new Date(second);
}

export function getInclusiveDayCount(start: Date, end: Date) {
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);
}
