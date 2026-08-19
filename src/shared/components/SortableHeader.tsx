import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface SortableHeaderProps<K extends string> {
  columns: ReadonlyArray<{ label: string; key: K | null; center?: boolean }>;
  sortBy: K;
  sortDir: "asc" | "desc";
  onSort: (key: K) => void;
}

/**
 * Renders a <tr> of sortable <th> headers.
 * - Active column shows ▲ or ▼ (ChevronUp / ChevronDown).
 * - Inactive sortable columns show a subtle ⇅ (ChevronsUpDown).
 * - Columns with key=null are not sortable (e.g. "actions").
 */
export function SortableHeaderRow<K extends string>({
  columns,
  sortBy,
  sortDir,
  onSort,
}: SortableHeaderProps<K>) {
  return (
    <tr className="bg-muted/20 border-b border-border/20">
      {columns.map((col, i) => {
        const isActive = col.key !== null && sortBy === col.key;
        const isSortable = col.key !== null;
        return (
          <th
            key={col.label || `_col_${i}`}
            className={`px-4 py-3 whitespace-nowrap select-none ${
              col.center ? "text-center" : "text-start"
            } ${isSortable ? "cursor-pointer hover:text-primary transition-colors" : ""} ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
            style={{ fontSize: 12 }}
            onClick={() => {
              if (col.key !== null) onSort(col.key);
            }}
          >
            <span
              className={`inline-flex items-center gap-1.5 ${col.center ? "justify-center" : ""}`}
            >
              {col.label}
              {isSortable &&
                isActive &&
                (sortDir === "asc" ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                ))}
              {isSortable && !isActive && (
                <ChevronsUpDown className="w-3 h-3 opacity-30" />
              )}
            </span>
          </th>
        );
      })}
    </tr>
  );
}

/** Helper hook-like toggle: call with current state to get next state */
export function toggleSort<K extends string>(
  key: K,
  currentKey: K,
  currentDir: "asc" | "desc",
  setSortBy: (k: K) => void,
  setSortDir: (d: "asc" | "desc") => void,
) {
  if (key === currentKey) {
    setSortDir(currentDir === "asc" ? "desc" : "asc");
  } else {
    setSortBy(key);
    setSortDir("asc");
  }
}
