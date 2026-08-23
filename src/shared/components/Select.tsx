import {
  memo,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
  /** When set, wraps the select in a labeled block; omit for a bare select. */
  label?: string;
  /** Overrides the default label styling; only used when `label` is set. */
  labelClassName?: string;
  /** Overrides the default label inline style (fontSize: 12); only used when `label` is set. */
  labelStyle?: CSSProperties;
  /** Plain strings render as both value and label; pass {value, label} when they differ. Omit to pass raw <option> children instead. */
  options?: readonly SelectOption[];
  /** When set with `options`, renders as the select's blank/placeholder option. */
  blankLabel?: string;
  children?: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

const DEFAULT_SELECT_CLASS =
  "w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

const DEFAULT_LABEL_CLASS = "text-foreground block mb-1.5";

const Select = ({
  label,
  labelClassName = DEFAULT_LABEL_CLASS,
  labelStyle = { fontSize: 12 },
  options,
  blankLabel,
  children,
  className = DEFAULT_SELECT_CLASS,
  ...selectProps
}: SelectProps) => {
  const select = (
    <select className={className} {...selectProps}>
      {options ? (
        <>
          {blankLabel !== undefined && <option value="">{blankLabel}</option>}
          {options.map((opt) => {
            const { value, label: optionLabel } =
              typeof opt === "string" ? { value: opt, label: opt } : opt;
            return (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            );
          })}
        </>
      ) : (
        children
      )}
    </select>
  );

  if (!label) return select;

  return (
    <div>
      <label className={labelClassName} style={labelStyle}>
        {label}
      </label>
      {select}
    </div>
  );
};
export default memo(Select);
