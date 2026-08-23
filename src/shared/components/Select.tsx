import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import SelectOptionRow from "./SelectOption";

const POPUP_GAP_PX = 4;

type PopupRect = { top: number; left: number; width: number };

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
  const [popupRect, setPopupRect] = useState<PopupRect | null>(null);
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
    const updatePosition = (): void => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopupRect({ top: rect.bottom + POPUP_GAP_PX, left: rect.left, width: rect.width });
    };
    updatePosition();
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
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const boxClassName = twMerge(
    "h-11 px-4 rounded-lg border border-border bg-input-background focus-within:ring-2 focus-within:ring-ring",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className,
  );

  const field = (
    <div ref={rootRef} className={`relative ${boxClassName}`} style={style} dir={dir}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onBlur={handleTriggerBlur}
        className="w-full h-full flex items-center justify-between gap-2 text-start focus:outline-none"
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

      {open && !disabled && popupRect
        ? createPortal(
            <div
              className="fixed z-[800] max-h-72 overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
              style={{ top: popupRect.top, left: popupRect.left, width: popupRect.width }}
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
            </div>,
            document.body,
          )
        : null}
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
