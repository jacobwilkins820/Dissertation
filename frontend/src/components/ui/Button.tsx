// Shared button with style variants and sizes. Makes sure consistency across the app.
type ButtonProps = {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  "inline-flex items-center justify-center rounded-full border font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary:
    "border-amber-400/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20 focus:ring-amber-400/40",
  secondary:
    "border-slate-700/60 bg-slate-800/60 text-slate-100 hover:bg-slate-700 focus:ring-slate-600/60",
  danger:
    "border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 focus:ring-rose-400/40",
  ghost:
    "border-transparent bg-transparent text-slate-200 hover:bg-slate-800/60 focus:ring-slate-600/60",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs tracking-[0.2em] uppercase",
  md: "px-4 py-2 text-sm uppercase",
  lg: "px-5 py-2.5 text-sm tracking-[0.18em] uppercase",
};

// Render a styled button with variant/size classes.
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
