import { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { usePopupPosition } from "@/shared/hooks/ui";
import MultiSelectOptionRow from "./MultiSelectOption";

export type MultiSelectItem = { value: string; label: string };

type MultiSelectProps = {
  items: MultiSelectItem[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** How to render the trigger label once something is selected. Defaults to joining labels. */
  formatSummary?: (selected: MultiSelectItem[]) => string;
  disabled?: boolean;
  className?: string;
};

const defaultFormatSummary = (selected: MultiSelectItem[]): string =>
  selected.map((item) => item.label).join("، ");

/**
 * Generic searchable checkbox multi-select, mirroring `Select`/`TypeAhead`'s
 * portaled-popup pattern. `Select` is single-value only, so features needing a
 * "pick several of these" control (e.g. the reports employee filter) share this
 * instead of hand-rolling one.
 */
const MultiSelect = ({
  items,
  selectedValues,
  onChange,
  placeholder = "",
  searchPlaceholder = "",
  formatSummary = defaultFormatSummary,
  disabled = false,
  className = "",
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const handleClose = (): void => {
    setOpen(false);
    setQuery("");
  };
  const { anchorRef: rootRef, rect: popupRect } = usePopupPosition(open, handleClose);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedItems = useMemo(
    () => items.filter((item) => selectedSet.has(item.value)),
    [items, selectedSet],
  );
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const toggleValue = useCallback(
    (value: string): void => {
      const next = selectedSet.has(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(next);
    },
    [selectedSet, selectedValues, onChange],
  );

  const handleOptionMouseDown = useCallback(
    (value: string) => (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      toggleValue(value);
    },
    [toggleValue],
  );

  const summaryLabel = selectedItems.length ? formatSummary(selectedItems) : "";

  const handleToggle = (): void => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const handleClearClick = (e: React.MouseEvent<HTMLSpanElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  };

  const handleSearchInputClick = (e: React.MouseEvent<HTMLInputElement>): void => {
    e.stopPropagation();
  };

  const handleDropdownPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  const boxClassName = twMerge(
    "h-11 px-4 rounded-lg border border-border bg-input-background focus-within:ring-2 focus-within:ring-ring",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className,
  );

  return (
    <div ref={rootRef} className={`relative ${boxClassName}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="w-full h-full flex items-center justify-between gap-2 text-start focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`truncate ${summaryLabel ? "text-foreground" : "text-muted-foreground"}`}
          style={{ fontSize: 13 }}
        >
          {summaryLabel || placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedItems.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClearClick}
              className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground"
              aria-label="clear"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </span>
      </button>

      {open && !disabled && popupRect
        ? createPortal(
            <div
              className="fixed z-[800] rounded-lg border border-border bg-card shadow-xl overflow-hidden"
              style={{ top: popupRect.top, left: popupRect.left, width: popupRect.width }}
              onPointerDown={handleDropdownPointerDown}
            >
              <div className="p-2 border-b border-border/40 flex items-center gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onClick={handleSearchInputClick}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 bg-transparent outline-none text-foreground placeholder:text-muted-foreground px-1"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div className="max-h-72 overflow-y-auto" role="listbox">
                {filteredItems.map((item) => (
                  <MultiSelectOptionRow
                    key={item.value}
                    label={item.label}
                    checked={selectedSet.has(item.value)}
                    onMouseDown={handleOptionMouseDown(item.value)}
                  />
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default MultiSelect;
