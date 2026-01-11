import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { TextField } from "./TextField";
import { getErrorMessage } from "../utils/utilFuncs";

// Generic async search select with debounce + optional summary.
type SearchSelectProps<T> = {
  label: string;
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  disabled?: boolean;
  resetKey?: number | string;
  selected: T | null;
  onSelect: (item: T | null) => void;
  onQueryChange?: (value: string) => void;
  fetchOptions: (query: string, signal: AbortSignal) => Promise<T[]>;
  getOptionKey: (item: T) => string | number;
  getOptionLabel: (item: T) => string;
  idleLabel?: string;
  loadingLabel?: string;
  resultsLabel?: string;
  emptyLabel?: string;
  showSelectedSummary?: boolean;
  showResults?: boolean;
  maxResults?: number;
};

// Render a search select list for results.
export function SearchSelect<T>({
  label,
  placeholder,
  minChars = 2,
  debounceMs = 350,
  disabled = false,
  resetKey,
  selected,
  onSelect,
  onQueryChange,
  fetchOptions,
  getOptionKey,
  getOptionLabel,
  idleLabel = "Type at least 2 characters.",
  loadingLabel = "Searching...",
  resultsLabel = "Results",
  emptyLabel = "No matches.",
  showSelectedSummary = true,
  showResults = true,
  maxResults,
}: SearchSelectProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resetKey === undefined) return;
    setQuery("");
    setResults([]);
    setError(null);
    if (onQueryChange) onQueryChange("");
  }, [onQueryChange, resetKey]);

  useEffect(() => {
    if (!showResults) return;
    if (disabled) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const q = query.trim();
    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOptions(q, controller.signal);
        setResults(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Search failed."));
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [debounceMs, disabled, fetchOptions, minChars, query, showResults]);

  const statusLabel = useMemo(() => {
    if (!showResults) return "";
    if (loading) return loadingLabel;
    if (query.trim().length < minChars) return idleLabel;
    if (results.length > 0) return resultsLabel;
    return emptyLabel;
  }, [
    emptyLabel,
    idleLabel,
    loading,
    loadingLabel,
    minChars,
    query,
    results.length,
    resultsLabel,
    showResults,
  ]);

  const selectedKey = selected ? getOptionKey(selected) : null;

  return (
    <div className="grid gap-2">
      <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
        {label}
        <TextField
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onQueryChange) onQueryChange(e.target.value);
            if (selected) onSelect(null);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
      </label>

      {showResults && error && <small className="text-rose-200">{error}</small>}

      {showResults && (
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {statusLabel}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="grid gap-2">
          {(maxResults ? results.slice(0, maxResults) : results).map((item) => {
            const key = getOptionKey(item);
            const labelText = getOptionLabel(item);
            const isSelected = selectedKey === key;

            return (
              <button
                key={String(key)}
                type="button"
                onClick={() => onSelect(item)}
                className={`rounded-2xl border border-slate-800/80 px-3 py-2 text-left text-sm text-slate-200 transition ${
                  isSelected ? "bg-slate-900/70" : "bg-transparent"
                }`}
              >
                {labelText}
              </button>
            );
          })}
        </div>
      )}

      {selected && showSelectedSummary && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 text-sm text-slate-200">
          <strong>Selected:</strong> {getOptionLabel(selected)}
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSelect(null)}
              disabled={disabled}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
