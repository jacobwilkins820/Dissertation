import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent as ReactChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { TextField } from "./TextField";

// Public contract for the date picker.
// The component is "controlled": parent owns the committed value.
// - `value` is expected in ISO format: YYYY-MM-DD
// - `onChange` emits ISO format when user clicks Apply
// - `size` is passed straight through to TextField styling
// - `className` lets parents control outer wrapper layout/width
type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

// Month labels shown in the popover header.
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

// Calendar grid headers in Monday -> Sunday order.
// This is intentionally different from JS Date.getDay() (Sunday-first),
// so an offset conversion is performed later when building the grid.
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Popover layout constants.
// - width: ideal panel width in px
// - viewport padding: minimum distance from viewport edges
// - gap: spacing between input (or navbar) and popover
const POPOVER_WIDTH = 288;
const VIEWPORT_PADDING = 12;
const POPOVER_GAP = 8;

// Utility used by both display and ISO formatters.
// Makes sure day/month are always two digits (e.g. 3 -> "03").
function pad2(value: number) {
  return String(value).padStart(2, "0");
}

// Gets number of days in a given month.
// `monthIndex` is zero-based (0 = January, 11 = December).
function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Strict parser for ISO date input.
// Accepts only YYYY-MM-DD and rejects impossible dates.
// Gets local Date object at local midnight (JS default for new Date(y,m,d)).
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

// Formats Date to ISO format used by forms/backend.
function formatISODate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

// User-facing text format for the read-only input field and preview.
function formatDisplayDate(date: Date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
}

// Day-level equality helper used for selected/today styling.
function isSameDay(date: Date, year: number, month: number, day: number) {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
}

// Calendar popover date picker with explicit "Apply".
//
// Data model:
// - Parent owns committed value (`value`) in ISO format.
// - Component keeps a temporary `draftDate` while popover is open.
// - Clicking a day changes only `draftDate`.
// - Clicking Apply sends `onChange(formatISODate(draftDate))`.
//
// UX model:
// - Input is read-only
// - Popover renders in a portal to avoid clipping/stacking issues.
// - Future dates are blocked.
export function DatePicker({
  value,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: DatePickerProps) {
  // Anchor element around the input, used to position the portal popover.
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Popover root, used for outside-click detection.
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const yearSelectId = useId();

  // Absolute document-space position for portal content.
  // Stored only while open; null means "not positioned yet".
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // Derived value from parent-controlled ISO string.
  // useMemo avoids reparsing unless `value` changes.
  const parsedValue = useMemo(() => parseISODate(value), [value]);
  // What the user sees in the text field (DD-MM-YYYY).
  const displayValue = parsedValue ? formatDisplayDate(parsedValue) : "";

  // Popover visibility state.
  const [open, setOpen] = useState(false);
  // Uncommitted selection while popover is open.
  const [draftDate, setDraftDate] = useState<Date | null>(null);

  // Calendar month/year currently shown in the grid.
  // Initialized from current value if available; otherwise today.
  const [viewYear, setViewYear] = useState(() =>
    (parsedValue ?? new Date()).getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(() =>
    (parsedValue ?? new Date()).getMonth(),
  );

  const getTriggerInput = useCallback(() => {
    return (
      containerRef.current?.querySelector<HTMLInputElement>("input") ?? null
    );
  }, []);

  const getPopoverFocusableElements = useCallback(() => {
    if (!popoverRef.current) return [] as HTMLElement[];
    return Array.from(
      popoverRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );
  }, []);

  const focusFirstPopoverElement = useCallback(() => {
    const [first] = getPopoverFocusableElements();
    if (first) {
      first.focus();
      return;
    }
    popoverRef.current?.focus();
  }, [getPopoverFocusableElements]);

  // Recompute popover coordinates relative to viewport + page scroll.
  // Why this exists:
  // - The popover is portalled to <body>, so it needs explicit top/left.
  // - We clamp horizontal position to keep it on screen.
  // - We keep it below a fixed navbar if one overlaps the trigger area.
  const updatePopoverPosition = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = Math.max(0, window.innerWidth - VIEWPORT_PADDING * 2);
    const width = Math.min(POPOVER_WIDTH, viewportWidth);
    const pageLeft = rect.left + window.scrollX;
    const pageTop = rect.bottom + window.scrollY + POPOVER_GAP;
    const minLeft = window.scrollX + VIEWPORT_PADDING;
    const maxLeft = Math.max(
      minLeft,
      window.scrollX + window.innerWidth - width - VIEWPORT_PADDING,
    );
    const left = Math.min(Math.max(pageLeft, minLeft), maxLeft);
    const navElement = document.querySelector("nav");
    const navBottomPage =
      navElement instanceof HTMLElement
        ? navElement.getBoundingClientRect().bottom + window.scrollY
        : 0;
    const top = Math.max(pageTop, navBottomPage + POPOVER_GAP);

    setPopoverPosition({
      top,
      left,
      width,
    });
  }, []);

  // Register global listeners only while popover is open.
  // Responsibilities:
  // - close on outside click
  // - close on Escape
  // - reposition on viewport changes (resize/scroll)
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (containerRef.current?.contains(targetNode)) return;
      if (popoverRef.current?.contains(targetNode)) return;
      setOpen(false);
    };
    const handleDocumentFocus = (event: FocusEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (containerRef.current?.contains(targetNode)) return;
      if (popoverRef.current?.contains(targetNode)) return;
      setOpen(false);
    };
    const handleViewportChange = () => {
      updatePopoverPosition();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => {
        getTriggerInput()?.focus();
      });
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("focusin", handleDocumentFocus);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("focusin", handleDocumentFocus);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [getTriggerInput, open, updatePopoverPosition]);

  // Opens the picker and syncs internal state from current value.
  // Important: this sync only happens on open, so the user can browse/select
  // inside the popover without immediately mutating the external form state.
  const handleOpen = () => {
    if (disabled || open) return;
    const base = parsedValue ?? new Date();
    setDraftDate(base);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    updatePopoverPosition();
    setOpen(true);
  };

  // Month navigation with year rollover.
  // Example: Jan 2026 -> Prev -> Dec 2025.
  const handlePrevMonth = () => {
    if (disabled) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
      return;
    }
    setViewMonth(viewMonth - 1);
  };

  // Month navigation with year rollover.
  // Example: Dec 2025 -> Next -> Jan 2026.
  const handleNextMonth = () => {
    if (disabled) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
      return;
    }
    setViewMonth(viewMonth + 1);
  };

  const handleYearChange = (event: ReactChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    const nextYear = Number(event.target.value);
    if (!Number.isFinite(nextYear)) return;
    setViewYear(nextYear);
  };

  // Updates temporary selection only.
  // Parent value is unchanged until handleApply().
  const handleDaySelect = (day: number) => {
    if (disabled) return;
    const selected = new Date(viewYear, viewMonth, day);
    selected.setHours(0, 0, 0, 0);
    if (selected > today) return;
    setDraftDate(selected);
  };

  // Commits selected date to parent in ISO format and closes the popover.
  const handleApply = () => {
    if (!draftDate || draftDate > today) return;
    onChange(formatISODate(draftDate));
    setOpen(false);
  };

  // Calendar grid math.
  // - firstDay uses JS Sunday-first indexing (Sun=0...Sat=6)
  // - offset Turns to Monday-first grid:
  //  Sun(0)->6, Mon(1)->0, Tue(2)->1,... Sat(6)->5
  // - totalSlots = leading blanks + real days
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const totalSlots = offset + daysInMonth;

  // Clean up "today" to midnight so date-only comparisons are stable.
  // Without this, comparing with current clock time could mark today's date
  // as "future" until its exact time passes.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, index) => currentYear - index,
  );

  const handleTriggerKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
      requestAnimationFrame(() => {
        focusFirstPopoverElement();
      });
      return;
    }

    if (event.key === "Tab" && !event.shiftKey && open) {
      const [firstPopoverElement] = getPopoverFocusableElements();
      if (!firstPopoverElement) return;
      event.preventDefault();
      firstPopoverElement.focus();
    }
  };

  const handlePopoverKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => {
        getTriggerInput()?.focus();
      });
      return;
    }

    if (event.key !== "Tab" || !event.shiftKey) return;

    const focusableElements = getPopoverFocusableElements();
    if (!focusableElements.length) return;
    if (document.activeElement !== focusableElements[0]) return;

    event.preventDefault();
    getTriggerInput()?.focus();
  };

  // Portal target guard for non-browser environments.
  const portalTarget = typeof document === "undefined" ? null : document.body;

  return (
    // Wrapper acts as trigger anchor for popover placement math.
    <div ref={containerRef} className={`relative ${className}`}>
      <TextField
        size={size}
        value={displayValue}
        placeholder="Select date"
        // Input is intentionally read-only: value must come from calendar.
        readOnly
        // Suppress virtual keyboard on touch devices.
        inputMode="none"
        className="cursor-pointer"
        onClick={handleOpen}
        onFocus={handleOpen}
        // Keyboard accessibility: Enter/Space opens picker.
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      />

      {/* Popover is rendered in a portal to avoid clipping by parent containers. */}
      {open &&
        portalTarget &&
        popoverPosition &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choose date"
            tabIndex={-1}
            onKeyDown={handlePopoverKeyDown}
            className="absolute z-10 rounded-3xl border border-slate-800 bg-slate-950 p-4 text-slate-200 shadow-2xl shadow-black/30"
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left,
              width: popoverPosition.width,
            }}
          >
            {/* Header: month navigation + current month/year label. */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={disabled}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:pointer-events-none disabled:opacity-60"
              >
                Prev
              </button>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-slate-100">
                  {MONTHS[viewMonth]}
                </div>
                <label htmlFor={yearSelectId} className="sr-only">
                  Select year
                </label>
                <select
                  id={yearSelectId}
                  value={viewYear}
                  onChange={handleYearChange}
                  disabled={disabled}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:pointer-events-none disabled:opacity-60"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={disabled}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:pointer-events-none disabled:opacity-60"
              >
                Next
              </button>
            </div>

            {/* Static weekday heading row (Monday-first). */}
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Day cells:
              - render leading blanks before day 1
              - then render one button per day
              - each day resolves selected/today/future visual state */}
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
                  new Date(viewYear, viewMonth, day).getTime() >
                  today.getTime();

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    disabled={disabled || isFuture}
                    // `aria-pressed` communicates toggle-like selected state.
                    aria-pressed={isSelected}
                    // Style priority:
                    // 1) selected date
                    // 2) today's date
                    // 3) future (disabled look)
                    // 4) normal selectable day
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 ${
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

            {/* Readout shows draft (uncommitted) selection for clarity. */}
            <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>Selected</span>
              <span className="text-sm font-semibold text-slate-100">
                {draftDate ? formatDisplayDate(draftDate) : "--"}
              </span>
            </div>

            {/* Commit action: without Apply, parent value remains unchanged. */}
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
          </div>,
          portalTarget,
        )}
    </div>
  );
}
