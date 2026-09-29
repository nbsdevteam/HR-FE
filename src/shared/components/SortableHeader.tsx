import type { ReactNode } from "react";
import SortableHeaderCell from "./components/SortableHeaderCell";

/** The sort a table shows when its page loads, and falls back to when a sort is cancelled. */
export type SortDefaults<K extends string> = { key: K; dir: "asc" | "desc" };

interface SortableHeaderProps<K extends string> {
  columns: ReadonlyArray<{ label: ReactNode; key: K | null; center?: boolean }>;
  sortBy: K;
  sortDir: "asc" | "desc";
  onSort: (key: K) => void;
}

/**
 * Cycle a header click through: asc → desc → back to `defaults`.
 * - A column that isn't selected yet starts at asc.
 * - The default column has nothing to cancel back to, so it just flips asc ⇄ desc.
 * - Any other column's third click cancels its sort and restores `defaults`,
 *   so it shows the neutral ⇅ again.
 */
export const toggleSort = <K extends string,>(
  key: K,
  currentKey: K,
  currentDir: "asc" | "desc",
  setSortBy: (k: K) => void,
  setSortDir: (d: "asc" | "desc") => void,
  defaults: SortDefaults<K>,
): void => {
  if (key !== currentKey) {
    setSortBy(key);
    setSortDir("asc");
    return;
  }
  if (key === defaults.key) {
    setSortDir(currentDir === "asc" ? "desc" : "asc");
    return;
  }
  if (currentDir === "asc") {
    setSortDir("desc");
    return;
  }
  setSortBy(defaults.key);
  setSortDir(defaults.dir);
};

/**
 * Renders a <tr> of sortable <th> headers.
 * - Active column shows ▲ or ▼ (ChevronUp / ChevronDown).
 * - Inactive sortable columns show a subtle ⇅ (ChevronsUpDown).
 * - Columns with key=null are not sortable (e.g. "actions").
 */
const SortableHeaderRow = <K extends string,>({
  columns,
  sortBy,
  sortDir,
  onSort,
}: SortableHeaderProps<K>) => {
  return (
    <tr className="bg-muted/20 border-b border-border/20">
      {columns.map((col, i) => (
        <SortableHeaderCell
          key={`_col_${i}`}
          label={col.label}
          sortKey={col.key}
          center={col.center}
          isActive={col.key !== null && sortBy === col.key}
          sortDir={sortDir}
          onSort={onSort}
        />
      ))}
    </tr>
  );
};

export default SortableHeaderRow;
