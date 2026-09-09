import { useCallback } from "react";

interface PositiveNumberInputProps {
  /** When set, wraps the input in a labeled block; omit for a bare input. */
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className: string;
  dir?: string;
  /** Allow a single decimal point (e.g. half-hour steps). Defaults to integers only. */
  allowDecimal?: boolean;
  /** Caps digits after the decimal point. Only meaningful when `allowDecimal` is set. */
  decimalPlaces?: number;
  min?: number;
  max?: number;
  step?: string;
}

const buildPattern = (allowDecimal: boolean, decimalPlaces?: number): RegExp => {
  if (!allowDecimal) return /^\d*$/;
  if (decimalPlaces !== undefined) return new RegExp(`^\\d*(\\.\\d{0,${decimalPlaces}})?$`);
  return /^\d*\.?\d*$/;
};

/** Empty string means "not yet sanitized against this pattern"; null means "reject". */
const sanitizePositiveNumber = (raw: string, allowDecimal: boolean, decimalPlaces?: number): string | null => {
  if (raw === "") return "";
  return buildPattern(allowDecimal, decimalPlaces).test(raw) ? raw : null;
};

/**
 * Text input restricted to positive numbers via regex, replacing native
 * `type="number"` inputs so behavior (no spinner, no silent-empty on invalid
 * keystrokes, no "-"/"+"/"e" sneaking through) is consistent everywhere.
 * Keeps the same string-in/string-out contract as `InputField` so existing
 * `Number(value)`/`parseInt(value)` casts at call sites keep working unchanged.
 */
const PositiveNumberInput = ({
  label,
  value,
  onChange,
  placeholder,
  className,
  dir = "ltr",
  allowDecimal = false,
  decimalPlaces,
  min = 0,
  max,
  step,
}: PositiveNumberInputProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const sanitized = sanitizePositiveNumber(e.target.value, allowDecimal, decimalPlaces);
      if (sanitized !== null) onChange(sanitized);
    },
    [onChange, allowDecimal, decimalPlaces]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>): void => {
      if (e.target.value === "") return;
      const numeric = Number(e.target.value);
      if (min !== undefined && numeric < min) {
        onChange(String(min));
        return;
      }
      if (max !== undefined && numeric > max) onChange(String(max));
    },
    [onChange, min, max]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>): void => {
      const pasted = e.clipboardData.getData("text");
      if (sanitizePositiveNumber(pasted, allowDecimal, decimalPlaces) === null) e.preventDefault();
    },
    [allowDecimal, decimalPlaces]
  );

  const input = (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onPaste={handlePaste}
      placeholder={placeholder}
      className={className}
      dir={dir}
      step={step}
      min={min}
      max={max}
    />
  );

  if (!label) return input;

  return (
    <div>
      <label className="block text-foreground text-sm mb-2">{label}</label>
      {input}
    </div>
  );
};

export default PositiveNumberInput;
