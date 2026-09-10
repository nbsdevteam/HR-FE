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
  /** Allow a single decimal point. Defaults to true; pass `false` to restrict a field to integers. */
  allowDecimal?: boolean;
  /** Caps digits after the decimal point. Only meaningful when `allowDecimal` is true (the default). */
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

/** The arrow-key increment amount — same "step defaults to 1" rule native `type="number"` uses. */
const parseStepAmount = (step?: string): number => {
  if (!step || step === "any") return 1;
  const parsed = parseFloat(step);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

/** Digits after the point in `step` (e.g. "0.5" -> 1), for rounding off float noise. */
const stepDecimalPlaces = (step?: string): number => {
  if (!step || step === "any") return 0;
  const dotIndex = step.indexOf(".");
  return dotIndex === -1 ? 0 : step.length - dotIndex - 1;
};

/**
 * Text input restricted to positive numbers via regex, replacing native
 * `type="number"` inputs so behavior (no spinner, no silent-empty on invalid
 * keystrokes, no "-"/"+"/"e" sneaking through) is consistent everywhere.
 * Accepts a decimal point by default (pass `allowDecimal={false}` to
 * restrict a field to integers); a trailing "." or an all-zero fraction
 * (e.g. "12.", "12.0") is normalized down to the integer part on blur.
 * ArrowUp/ArrowDown increment or decrement by `step` (defaulting to 1,
 * same as native `type="number"`), clamped to `min`/`max`.
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
  allowDecimal = true,
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      onKeyDown?.(e);
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const delta = parseStepAmount(step);
      const current = value === "" ? 0 : Number(value);
      let next = e.key === "ArrowUp" ? current + delta : current - delta;
      if (min !== undefined) next = Math.max(next, min);
      if (max !== undefined) next = Math.min(next, max);
      const precision = decimalPlaces ?? stepDecimalPlaces(step);
      onChange(String(Number(next.toFixed(precision))));
    },
    [onKeyDown, step, value, min, max, decimalPlaces, onChange]
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
      onKeyDown={handleKeyDown}
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
