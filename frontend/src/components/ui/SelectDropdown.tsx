import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";

type SelectOption = {
  value: string | number;
  label: string;
};

// Shared select dropdown with size variants.
type SelectDropdownProps = {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
};

const base =
  "w-full rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 " +
  "transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40";

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

// Render a styled select dropdown with a custom option list.
export function SelectDropdown({
  value,
  options,
  onChange,
  size = "md",
  className = "",
  disabled = false,
}: SelectDropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(() => {
    const match = options.find((option) => option.value === value);
    return match ? match.label : "Select";
  }, [options, value]);

  const handleOptionSelect = (
    event: ReactMouseEvent<HTMLButtonElement>,
    optionValue: string | number
  ) => {
    // Prevent label/default click forwarding from reopening the dropdown.
    event.preventDefault();
    event.stopPropagation();

    // Close immediately so UI always collapses on selection.
    // This keeps behavior consistent even if parent onChange work is slow.
    setOpen(false);
    onChange(String(optionValue));
  };

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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`${base} ${sizes[size]} pr-9 text-left truncate disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        {selectedLabel}
      </button>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
        v
      </span>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 p-1 text-sm text-slate-100 shadow-2xl shadow-black/30"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`w-full rounded-xl px-3 py-2 text-left truncate transition ${
                  isSelected
                    ? "bg-slate-900 text-slate-100"
                    : "text-slate-200 hover:bg-slate-900"
                }`}
                onMouseDown={(event) => {
                  // Avoid focus/label side effects before click dispatch.
                  event.preventDefault();
                }}
                onClick={(event) => {
                  handleOptionSelect(event, option.value);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
