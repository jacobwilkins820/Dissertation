import type { ReactNode } from "react";

// Generic status badge that Turns to consistent colors.
type StatusBadgeProps = {
  value?: string | null;
  children?: ReactNode;
  className?: string;
};

// Centralized status to color mapping used across tables/cards.
function statusClasses(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-300/40 bg-emerald-400/10 text-emerald-200";
    case "INACTIVE":
      return "border-amber-300/40 bg-amber-400/10 text-amber-200";
    case "WITHDRAWN":
      return "border-rose-400/40 bg-rose-500/10 text-rose-200";
    default:
      return "border-slate-600/40 bg-slate-800/60 text-slate-300";
  }
}

export function StatusBadge({
  value,
  children,
  className = "",
}: StatusBadgeProps) {
  const content = children ?? value ?? "UNKNOWN";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClasses(value)} ${className}`.trim()}
    >
      {content}
    </span>
  );
}
