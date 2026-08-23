import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronsUpDown, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import TypeAheadPopup from "./TypeAheadPopup";

const POPUP_GAP_PX = 4;

type PopupRect = { top: number; left: number; width: number };

type TypeAheadProps<T> = {
  items: T[];
  value: string;
  onChange: (id: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string | null | undefined;
  getSearchText?: (item: T) => string;
  filter?: (item: T) => boolean;
  excludeIds?: string[];
  fallbackLabels?: Record<string, string>;
  blankLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  showDescription?: boolean;
  className?: string;
};

function findItem<T>(items: T[], valueKey: string, getId: (item: T) => string): T | null {
  if (!valueKey) return null;
  return items.find((item) => getId(item) === valueKey) || null;
}

const TypeAhead = <T,>({
  items,
  value,
  onChange,
  getId,
  getLabel,
  getDescription,
  getSearchText,
  filter,
  excludeIds,
  fallbackLabels,
  blankLabel,
  placeholder,
  searchPlaceholder,
  disabled = false,
  showDescription = true,
  className = "",
}: TypeAheadProps<T>) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [popupRect, setPopupRect] = useState<PopupRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const exclude = useMemo(
    () => new Set((excludeIds || []).map((id) => String(id))),
    [excludeIds],
  );

  const valueKey = value == null || value === "" ? "" : String(value);

  const selected = useMemo(
    () => findItem(items, valueKey, getId),
    [items, valueKey, getId],
  );

  const selectedName = useMemo(() => {
    if (!valueKey) return "";
    if (selected) return getLabel(selected);
    return fallbackLabels?.[valueKey] || "";
  }, [valueKey, selected, getLabel, fallbackLabels]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (item: T): boolean => {
      if (!q) return true;
      const text = (
        getSearchText
          ? getSearchText(item)
          : [getLabel(item), getDescription?.(item)].filter(Boolean).join(" ")
      ).toLowerCase();
      return text.includes(q);
    };
    return items
      .filter((item) => !exclude.has(getId(item)))
      .filter((item) => (filter ? filter(item) : true))
      .filter(matches)
      .slice()
      .sort((a, b) => getLabel(a).localeCompare(getLabel(b), "ar"));
  }, [items, exclude, filter, query, getSearchText, getLabel, getDescription, getId]);

  const triggerPlaceholder = placeholder || arabicSource("common.select");
  const searchBoxPlaceholder = searchPlaceholder || arabicSource("common.search");
  const showBlankOption = blankLabel !== undefined;

  const pick = (item: T): void => {
    onChange(getId(item));
    setOpen(false);
    setQuery("");
  };

  const clear = (): void => {
    onChange("");
  };

  const handleToggle = (): void => {
    if (disabled) return;
    setOpen((v) => !v);
    setQuery("");
  };

  const handleClearClick = (e: React.MouseEvent<HTMLSpanElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    clear();
  };

  const handleClearKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      clear();
    }
  };

  const handleDropdownPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
  };

  const handleSearchInputClick = (e: React.MouseEvent<HTMLInputElement>): void => {
    e.stopPropagation();
  };

  const handleBlankMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      onChange("");
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleOptionMouseDown = useCallback(
    (item: T) => (e: React.MouseEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      pick(item);
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
        setQuery("");
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    // pointerdown bubble (not capture-click) avoids racing option selection.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        className={`w-full h-10 px-3 rounded-lg border border-border bg-input-background flex items-center gap-2 ${
          disabled ? "opacity-50" : "cursor-pointer"
        } focus-within:ring-2 focus-within:ring-ring`}
        onClick={handleToggle}
      >
        {/*
          Readonly input guarantees the browser paints the value. A flex+truncate
          <span> inside a <button> was collapsing / not updating after pick.
        */}
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={selectedName}
          placeholder={triggerPlaceholder}
          data-selected-id={valueKey || undefined}
          className="min-w-0 flex-1 h-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground cursor-pointer"
          style={{ fontSize: 13 }}
          dir="auto"
          aria-haspopup="listbox"
          aria-expanded={open}
        />
        <span className="flex items-center gap-1 shrink-0">
          {!!valueKey && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClearClick}
              onKeyDown={handleClearKeyDown}
              className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground"
              aria-label="clear"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </span>
      </div>

      {open && popupRect
        ? createPortal(
            <TypeAheadPopup
              rect={popupRect}
              query={query}
              onQueryChange={handleQueryChange}
              onSearchInputClick={handleSearchInputClick}
              searchRef={searchRef}
              searchPlaceholder={searchBoxPlaceholder}
              onPointerDown={handleDropdownPointerDown}
              showBlankOption={showBlankOption}
              blankLabel={blankLabel}
              isBlankActive={valueKey === ""}
              onBlankMouseDown={handleBlankMouseDown}
              options={options}
              getId={getId}
              getLabel={getLabel}
              getDescription={getDescription}
              showDescription={showDescription}
              activeId={valueKey}
              onOptionMouseDown={handleOptionMouseDown}
              visibleCount={options.length}
              totalCount={
                items.filter((item) => !exclude.has(getId(item)) && (!filter || filter(item)))
                  .length
              }
            />,
            document.body,
          )
        : null}
    </div>
  );
};

export default TypeAhead;
