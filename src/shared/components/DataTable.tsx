import type { CSSProperties, ReactNode } from "react";
import { useWindowedRows } from "@/shared/hooks/useWindowedRows";

/** Opt-in row windowing for tables whose row count can grow into the hundreds. */
export type DataTableVirtualization = {
  /** Approximate rendered height of one row, in px. */
  rowHeight: number;
  /** Extra rows rendered above/below the viewport. Defaults to 8. */
  overscan?: number;
  /** Row count below which windowing is skipped entirely. Defaults to 100. */
  threshold?: number;
};

interface DataTableProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => ReactNode;
  /** `<thead>` content — typically a `<TableHeaderRow>` or `<SortableHeaderRow>`. */
  header: ReactNode;
  /** Rendered as the sole `<tr>` in `<tbody>` when `items` is empty — keeps the header/wrapper chrome visible. */
  emptyRow?: ReactNode;
  /** Full replacement for the wrapper + table when `items` is empty (no header/chrome shown). */
  emptyState?: ReactNode;
  /** Wrapper div className. Pass `null` to skip the wrapper div (e.g. when the caller supplies its own card/motion wrapper). */
  wrapperClassName?: string | null;
  tableClassName?: string;
  tableStyle?: CSSProperties;
  /** className for the scroll container around `<table>`. */
  scrollClassName?: string;
  /** className for `<thead>` — e.g. to make it sticky. */
  theadClassName?: string;
  /**
   * When set, only the rows near the viewport are rendered, padded by two
   * spacer rows so scroll height and column widths stay correct. Omit to render
   * every row (the default, and correct for short lists).
   */
  virtualization?: DataTableVirtualization;
}

const DEFAULT_WRAPPER = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";

/**
 * Shared table shell — card wrapper, horizontal scroll, header slot, empty
 * state — factored out of the many features that hand-roll the same
 * `overflow-x-auto` + `<table>` markup around their own rows.
 */
const DataTable = <T,>({
  items,
  renderRow,
  header,
  emptyRow,
  emptyState,
  wrapperClassName = DEFAULT_WRAPPER,
  tableClassName = "w-full",
  tableStyle,
  scrollClassName = "overflow-x-auto",
  theadClassName,
  virtualization,
}: DataTableProps<T>) => {
  const { containerRef, startIndex, endIndex, topPadding, bottomPadding } = useWindowedRows({
    rowCount: items.length,
    rowHeight: virtualization?.rowHeight ?? 0,
    overscan: virtualization?.overscan,
    threshold: virtualization?.threshold,
  });

  const isEmpty = items.length === 0;

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  const isWindowed = Boolean(virtualization) && (startIndex > 0 || endIndex < items.length);

  const rows = isEmpty
    ? (emptyRow ?? null)
    : virtualization
      ? items.slice(startIndex, endIndex).map((item, offset) => renderRow(item, startIndex + offset))
      : items.map(renderRow);

  const table = (
    <div className={scrollClassName}>
      <table className={tableClassName} style={tableStyle}>
        <thead className={theadClassName}>{header}</thead>
        <tbody ref={containerRef}>
          {isWindowed && topPadding > 0 && <tr aria-hidden="true" style={{ height: topPadding }} />}
          {rows}
          {isWindowed && bottomPadding > 0 && <tr aria-hidden="true" style={{ height: bottomPadding }} />}
        </tbody>
      </table>
    </div>
  );

  return wrapperClassName === null ? table : <div className={wrapperClassName}>{table}</div>;
};

export default DataTable;
