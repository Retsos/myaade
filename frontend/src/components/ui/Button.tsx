// Standardized button used across the app.
// Variants and sizes are centralized here so visual tweaks are one-place edits.
// `loading=true` swaps the left icon with a spinner and disables the button.
import React from "react";
import { Spinner } from "../Spinner";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-500/50",
  secondary:
    "bg-slate-700 text-slate-100 hover:bg-slate-600 active:bg-slate-700 disabled:bg-slate-700/50",
  danger:
    "bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 disabled:bg-rose-500/50",
  success:
    "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50",
  ghost:
    "bg-transparent text-slate-300 hover:bg-slate-800 active:bg-slate-700 disabled:text-slate-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50
        disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? <Spinner size={16} className="text-white" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}
