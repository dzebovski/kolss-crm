import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50";
  const variants = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondary:
      "border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)]",
    ghost: "text-[var(--muted)] hover:text-[var(--foreground)]",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
