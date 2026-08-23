import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";
import { ChevronsUpDown } from "lucide-react";
import SelectOptionRow from "./SelectOption";

export type SelectOption =
  | string
  | { value: string; label: string; disabled?: boolean }
  | { divider: true };

type NormalizedOption = { value: string; label: string; disabled?: boolean } | { divider: true };

type SelectProps = {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  blankLabel?: string;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
  labelStyle?: CSSProperties;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  dir?: "ltr" | "rtl" | "auto";
  title?: string;
  "aria-label"?: string;
  onBlur?: () => void;
};

const DEFAULT_LABEL_CLASS = "text-foreground block mb-1.5";

function normalizeOption(opt: SelectOption): NormalizedOption {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

const Select = ({
  options,
  value,
  onChange,
  blankLabel,
  placeholder,
  label,
  labelClassName = DEFAULT_LABEL_CLASS,
  labelStyle = { fontSize: 12 },
  disabled = false,
  className = "",
  style,
  dir,
  title,
  "aria-label": ariaLabel,
  onBlur,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const normalized = options.map(normalizeOption);
  const selected = normalized.find(
    (opt): opt is Extract<NormalizedOption, { value: string }> =>
      !("divider" in opt) && opt.value === value,
  );
  const selectedLabel = selected
    ? selected.label
    : blankLabel !== undefined && value === ""
      ? blankLabel
      : "";

  const handleToggle = (): void => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const handleTriggerBlur = (): void => {
    onBlur?.();
  };

  const handleDropdownPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  const pick = (optValue: string): void => {
    onChange(optValue);
    setOpen(false);
  };

  const handleOptionMouseDown = useCallback(
    (optValue: string) => (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      pick(optValue);
    },
    [pick],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const field = (
    <div ref={rootRef} className={`relative ${className}`} dir={dir}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onBlur={handleTriggerBlur}
        className={`w-full h-11 px-4 rounded-lg border border-border bg-input-background flex items-center justify-between gap-2 text-start ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } focus:outline-none focus:ring-2 focus:ring-ring`}
        style={style}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span
          className={`truncate ${selectedLabel ? "text-foreground" : "text-muted-foreground"}`}
          style={{ fontSize: 13 }}
        >
          {selectedLabel || placeholder || ""}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && !disabled ? (
        <div
          className="absolute z-[800] mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
          role="listbox"
          onPointerDown={handleDropdownPointerDown}
        >
          {blankLabel !== undefined && (
            <SelectOptionRow
              label={blankLabel}
              active={value === ""}
              onMouseDown={handleOptionMouseDown("")}
            />
          )}
          {normalized.map((opt, i) =>
            "divider" in opt ? (
              <div key={`divider-${i}`} className="my-1 border-t border-border/40" />
            ) : (
              <SelectOptionRow
                key={opt.value}
                label={opt.label}
                active={opt.value === value}
                disabled={opt.disabled}
                onMouseDown={handleOptionMouseDown(opt.value)}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );

  if (!label) return field;

  return (
    <div>
      <label className={labelClassName} style={labelStyle}>
        {label}
      </label>
      {field}
    </div>
  );
};

export default Select;
