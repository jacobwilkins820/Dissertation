import type { ReactNode } from "react";

type StateMessageProps = {
  children: ReactNode;
  className?: string;
  inline?: boolean;
};

export function StateMessage({
  children,
  className = "",
  inline = false,
}: StateMessageProps) {
  const base = inline
    ? "text-sm text-slate-400"
    : "px-6 py-8 text-center text-sm text-slate-400";
  return <div className={`${base} ${className}`.trim()}>{children}</div>;
}
