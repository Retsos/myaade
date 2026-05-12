// Styled <select> with a custom chevron icon. We hide the native arrow
// (appearance-none) so the dropdown indicator sits at a predictable place
// across browsers and the visual matches the other Input fields.
import React, { forwardRef } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    hint,
    options,
    placeholder,
    className = "",
    id,
    ...rest
  },
  ref,
) {
  const selectId =
    id ||
    (label ? `sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...rest}
          id={selectId}
          ref={ref}
          className={`
            w-full appearance-none bg-slate-900 border rounded-lg
            pl-3 pr-9 py-2 text-sm text-slate-200
            [color-scheme:dark]
            focus:outline-none focus:ring-1 transition-colors cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30"
                : "border-slate-700 focus:border-brand-500 focus:ring-brand-500/30"
            }
            ${className}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
