type SelectFieldOption = string | { value: string; label: string };

interface SelectFieldProps {
  /** When set, wraps the select in a labeled block; omit for a bare select. */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Plain strings render as both value and label; pass {value, label} when they differ. */
  options: readonly SelectFieldOption[];
  /** When set, renders as the select's blank/placeholder option. */
  blankLabel?: string;
  className: string;
}

/**
 * Shared labeled/bare select-from-options field, factored out of the
 * near-identical versions training and warnings each built independently.
 */
const SelectField = ({
  label,
  value,
  onChange,
  options,
  blankLabel,
  className,
}: SelectFieldProps) => {
  const select = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {blankLabel !== undefined && <option value="">{blankLabel}</option>}
      {options.map((opt) => {
        const { value: optValue, label: optLabel } =
          typeof opt === "string" ? { value: opt, label: opt } : opt;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );

  if (!label) return select;

  return (
    <div>
      <label className="block text-sm text-foreground mb-2">{label}</label>
      {select}
    </div>
  );
};

export default SelectField;
