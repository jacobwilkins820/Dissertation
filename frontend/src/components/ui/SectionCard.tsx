import type { ReactNode } from "react";

// Shared card container used by pages for consistent panel styling.
type Padding = "none" | "sm" | "md" | "lg";

// Named spacing presets to avoid one-off padding classes.
const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  padding?: Padding;
};

export function SectionCard({
  children,
  className = "",
  padding = "md",
}: SectionCardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/30 ${paddingClasses[padding]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
