import type { ReactNode } from "react";

// Supported semantic banner styles.
type AlertVariant = "error" | "success" | "info";

// Variant color mapping shared across pages and modals.
const variantClasses: Record<AlertVariant, string> = {
  error: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  info: "border-slate-700/60 bg-slate-900/60 text-slate-200",
};

type AlertBannerProps = {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
};

export function AlertBanner({
  children,
  variant = "info",
  className = "",
}: AlertBannerProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-xs ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
