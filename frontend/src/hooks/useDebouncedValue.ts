import { useEffect, useState } from "react";

// Gets a delayed copy of `value` that updates only after `delayMs` of silence.
// Useful for search inputs to avoid firing API calls on every keypress.
export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Reset the timer whenever value or delay changes.
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Prevent stale updates when component unmounts
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
