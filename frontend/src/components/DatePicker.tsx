import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { TextField } from "./TextField";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Month labels for the header.
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Week header uses a Monday-first calendar layout.
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Pad a number to 2 digits for stable date formatting.
function pad2(value: number) {
  return String(value).padStart(2, "0");
}

// Count days for a given month/year pair.
function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Parse YYYY-MM-DD into a Date for calendar math.
function parseISODate(value: string): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12) return null;
  const daysInMonth = getDaysInMonth(year, month - 1);
  if (day < 1 || day > daysInMonth) return null;
  return new Date(year, month - 1, day);
}

// Keep the stored value as ISO YYYY-MM-DD.
function formatISODate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

// Displayed as DD-MM-YYYY while we store ISO values.
function formatDisplayDate(date: Date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
}

// Compare dates without time components.
function isSameDay(date: Date, year: number, month: number, day: number) {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
}

// Calendar-based date picker that requires an explicit Apply.
export function DatePicker({
  value,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Parse the external value once for display and initialization.
  const parsedValue = useMemo(() => parseISODate(value), [value]);
  const displayValue = parsedValue ? formatDisplayDate(parsedValue) : "";
  // Control the calendar popover visibility.
  const [open, setOpen] = useState(false);
  // Draft selection stored until Apply is pressed.
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  // Calendar view state tracks the current month grid.
  const [viewYear, setViewYear] = useState(() =>
    (parsedValue ?? new Date()).getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    (parsedValue ?? new Date()).getMonth()
  );

  // closes the popover when clicking outside of it
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const handleOpen = () => {
    if (disabled || open) return;
    // Initialize the draft and calendar view from the current value.
    const base = parsedValue ?? new Date();
    setDraftDate(base);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  // Navigate to the previous month, adjusting year when needed.
  const handlePrevMonth = () => {
    if (disabled) return;
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((year) => year - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  // Navigate to the next month, adjusting year when needed.
  const handleNextMonth = () => {
    if (disabled) return;
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Update the draft selection without committing it.
  const handleDaySelect = (day: number) => {
    if (disabled) return;
    const selected = new Date(viewYear, viewMonth, day);
    selected.setHours(0, 0, 0, 0);
    if (selected > today) return;
    setDraftDate(selected);
  };

  // Commit the draft selection and close the popover.
  const handleApply = () => {
    if (!draftDate || draftDate > today) return;
    onChange(formatISODate(draftDate));
    setOpen(false);
  };

  // Calendar grid calculations.
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  // Shift Sunday-based index so the grid starts on Monday.
  const offset = (firstDay + 6) % 7;
  const totalSlots = offset + daysInMonth;
  // Normalize "today" to midnight for reliable comparisons.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <TextField
        size={size}
        value={displayValue}
        placeholder="Select date"
        // Enforce calendar-only selection.
        readOnly
        inputMode="none"
        className="cursor-pointer"
        onClick={handleOpen}
        onFocus={handleOpen}
        // Support keyboard opening without allowing text input.
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpen();
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      />

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 top-full z-20 mt-2 w-[18rem] rounded-3xl border border-slate-800 bg-slate-950 p-4 text-slate-200 shadow-2xl shadow-black/30"
        >
          {/* Month navigation header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={disabled}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 disabled:pointer-events-none disabled:opacity-60"
            >
              Prev
            </button>
            <div className="text-sm font-semibold text-slate-100">
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={disabled}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 disabled:pointer-events-none disabled:opacity-60"
            >
              Next
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar day grid */}
          <div className="mt-2 grid grid-cols-7 gap-1">
            {Array.from({ length: totalSlots }).map((_, index) => {
              if (index < offset) {
                return <div key={`empty-${index}`} className="h-9 w-9" />;
              }

              const day = index - offset + 1;
              const isSelected =
                !!draftDate && isSameDay(draftDate, viewYear, viewMonth, day);
              const isToday = isSameDay(today, viewYear, viewMonth, day);
              const isFuture =
                new Date(viewYear, viewMonth, day).getTime() > today.getTime();

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  disabled={disabled || isFuture}
                  aria-pressed={isSelected}
                  // Style priority: selected, today, then default.
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                    isSelected
                      ? "border-amber-400/40 bg-amber-300/20 text-amber-100"
                      : isToday
                        ? "border-slate-600 text-slate-100"
                        : isFuture
                          ? "border-transparent text-slate-600"
                          : "border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Preview of the draft selection */}
          <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
            <span>Selected</span>
            <span className="text-sm font-semibold text-slate-100">
              {draftDate ? formatDisplayDate(draftDate) : "--"}
            </span>
          </div>

          {/* Apply is required to commit the selected date */}
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleApply}
              disabled={disabled || !draftDate || draftDate > today}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
