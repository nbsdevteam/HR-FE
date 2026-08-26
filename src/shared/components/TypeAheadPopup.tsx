import type { RefObject } from "react";
import { Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import TypeAheadOption from "./TypeAheadOption";

type PopupRect = { left: number; width: number; top?: number; bottom?: number };

type TypeAheadPopupProps<T> = {
  rect: PopupRect;
  query: string;
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchInputClick: (e: React.MouseEvent<HTMLInputElement>) => void;
  searchRef: RefObject<HTMLInputElement>;
  searchPlaceholder: string;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  showBlankOption: boolean;
  blankLabel?: string;
  isBlankActive: boolean;
  onBlankMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  options: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string | null | undefined;
  showDescription: boolean;
  activeId: string;
  onOptionMouseDown: (item: T) => (e: React.MouseEvent<HTMLButtonElement>) => void;
  visibleCount: number;
  totalCount: number;
};

const TypeAheadPopup = <T,>({
  rect,
  query,
  onQueryChange,
  onSearchInputClick,
  searchRef,
  searchPlaceholder,
  onPointerDown,
  showBlankOption,
  blankLabel,
  isBlankActive,
  onBlankMouseDown,
  options,
  getId,
  getLabel,
  getDescription,
  showDescription,
  activeId,
  onOptionMouseDown,
  visibleCount,
  totalCount,
}: TypeAheadPopupProps<T>) => (
  <div
    className="fixed z-[800] rounded-lg border border-border bg-card shadow-xl overflow-hidden"
    style={{ top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width }}
    onPointerDown={onPointerDown}
  >
    <div className="p-2 border-b border-border/40 flex items-center gap-2">
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        ref={searchRef}
        type="text"
        value={query}
        onChange={onQueryChange}
        onClick={onSearchInputClick}
        placeholder={searchPlaceholder}
        className="w-full h-8 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        style={{ fontSize: 13 }}
      />
    </div>
    <div className="max-h-96 overflow-y-auto" role="listbox">
      {showBlankOption && (
        <TypeAheadOption
          label={blankLabel as string}
          active={isBlankActive}
          onMouseDown={onBlankMouseDown}
        />
      )}
      {options.length === 0 && !showBlankOption ? (
        <p className="px-3 py-3 text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("common.no_results_found")}
        </p>
      ) : (
        options.map((item) => (
          <TypeAheadOption
            key={getId(item)}
            label={getLabel(item)}
            description={showDescription ? getDescription?.(item) : undefined}
            active={getId(item) === activeId}
            onMouseDown={onOptionMouseDown(item)}
          />
        ))
      )}
    </div>
    <div
      className="px-3 py-1.5 border-t border-border/40 text-muted-foreground"
      style={{ fontSize: 10 }}
    >
      {visibleCount} / {totalCount}
    </div>
  </div>
);

export default TypeAheadPopup;
