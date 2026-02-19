import type { ReactNode } from "react";

type PageHeaderProps = {
  label: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  label,
  title,
  subtitle,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className="pt-10">
      <div
        className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`.trim()}
      >
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {label}
          </p>
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
        </div>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
