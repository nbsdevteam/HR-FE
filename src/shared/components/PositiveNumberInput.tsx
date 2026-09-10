import { useCallback } from "react";

interface PositiveNumberInputProps {
  /** When set, wraps the input in a labeled block; omit for a bare input. */
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className: string;
  dir?: string;
  style?: React.CSSProperties;
  /** Allow a single decimal point (e.g. half-hour steps). Defaults to integers only. */
  allowDecimal?: boolean;
  /** Caps digits after the decimal point. Only meaningful when `allowDecimal` is set. */
  decimalPlaces?: number;
  min?: number;
  max?: number;
  step?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
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

/** "12." -> "12", "12.0"/"12.00" -> "12", "." or ".0" -> "" — a trailing dot with
 *  nothing meaningful after it is dropped once the field is done being typed into. */
const stripTrailingZeroFraction = (raw: string): string => {
  const dotIndex = raw.indexOf(".");
  if (dotIndex === -1) return raw;
  const fraction = raw.slice(dotIndex + 1);
  return fraction === "" || /^0+$/.test(fraction) ? raw.slice(0, dotIndex) : raw;
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
  style,
  allowDecimal = false,
  decimalPlaces,
  min = 0,
  max,
  step,
  autoFocus,
  onKeyDown,
  onBlur,
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
      const raw = e.target.value;
      if (raw !== "") {
        const numeric = Number(raw);
        if (min !== undefined && numeric < min) {
          onChange(String(min));
        } else if (max !== undefined && numeric > max) {
          onChange(String(max));
        } else if (allowDecimal) {
          const normalized = stripTrailingZeroFraction(raw);
          if (normalized !== raw) onChange(normalized);
        }
      }
      onBlur?.(e);
    },
    [onChange, min, max, onBlur, allowDecimal]
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
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      placeholder={placeholder}
      className={className}
      dir={dir}
      style={style}
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
