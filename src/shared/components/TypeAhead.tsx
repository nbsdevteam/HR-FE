import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { ChevronsUpDown, Search, X } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import TypeAheadOption from "./TypeAheadOption";

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
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
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

      {open ? (
        <div
          className="absolute z-[800] mt-1 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden"
          onPointerDown={handleDropdownPointerDown}
        >
          <div className="p-2 border-b border-border/40 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onClick={handleSearchInputClick}
              placeholder={searchBoxPlaceholder}
              className="w-full h-8 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontSize: 13 }}
            />
          </div>
          <div className="max-h-96 overflow-y-auto" role="listbox">
            {showBlankOption && (
              <TypeAheadOption
                label={blankLabel as string}
                active={valueKey === ""}
                onMouseDown={handleBlankMouseDown}
              />
            )}
            {options.length === 0 && !showBlankOption ? (
              <p
                className="px-3 py-3 text-muted-foreground"
                style={{ fontSize: 12 }}
              >
                {arabicSource("common.no_results_found")}
              </p>
            ) : (
              options.map((item) => (
                <TypeAheadOption
                  key={getId(item)}
                  label={getLabel(item)}
                  description={showDescription ? getDescription?.(item) : undefined}
                  active={getId(item) === valueKey}
                  onMouseDown={handleOptionMouseDown(item)}
                />
              ))
            )}
          </div>
          <div
            className="px-3 py-1.5 border-t border-border/40 text-muted-foreground"
            style={{ fontSize: 10 }}
          >
            {options.length} /{" "}
            {
              items.filter(
                (item) => !exclude.has(getId(item)) && (!filter || filter(item)),
              ).length
            }
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TypeAhead;
