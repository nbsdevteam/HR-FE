import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import EmptyState from "./EmptyState";

interface DataTableProps<T> {
  items: T[];
  renderRow: (item: T, index: number) => ReactNode;
  /** `<thead>` content — typically a `<TableHeaderRow>` or `<SortableHeaderRow>`. */
  header: ReactNode;
  emptyIcon?: LucideIcon;
  emptyMessage: string;
  /** Full replacement for the card wrapper's className (not merged). */
  wrapperClassName?: string;
  tableClassName?: string;
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
  emptyIcon,
  emptyMessage,
  wrapperClassName = DEFAULT_WRAPPER,
  tableClassName = "w-full",
}: DataTableProps<T>) => {
  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} message={emptyMessage} className="py-12" />;
  }

  return (
    <div className={wrapperClassName}>
      <div className="overflow-x-auto">
        <table className={tableClassName}>
          <thead>{header}</thead>
          <tbody>{items.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
