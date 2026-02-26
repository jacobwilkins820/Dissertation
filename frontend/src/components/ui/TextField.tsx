// Shared input with size variants.
type TextFieldProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

const base =
  "inline-flex w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 text-slate-100 " +
  "placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40";

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

// Render a styled text input.
export function TextField({
  size = "md",
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <input
      type="text"
      className={`${base} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
