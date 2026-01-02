type TextFieldProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

const base =
  "inline-flex w-full font-medium rounded-md transition " +
  "bg-gray-50 border border-gray-300 text-gray-900 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:border-blue-500";

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

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
