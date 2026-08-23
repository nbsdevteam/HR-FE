import type { CSSProperties, ReactNode } from "react";

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
}: DataTableProps<T>) => {
  const isEmpty = items.length === 0;

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  const table = (
    <div className={scrollClassName}>
      <table className={tableClassName} style={tableStyle}>
        <thead className={theadClassName}>{header}</thead>
        <tbody>{isEmpty ? (emptyRow ?? null) : items.map(renderRow)}</tbody>
      </table>
    </div>
  );

  return wrapperClassName === null ? table : <div className={wrapperClassName}>{table}</div>;
};

export default DataTable;
