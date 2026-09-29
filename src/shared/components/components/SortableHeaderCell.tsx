import type { ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type SortableHeaderCellProps<K extends string> = {
  label: ReactNode;
  sortKey: K | null;
  center?: boolean;
  isActive: boolean;
  sortDir: "asc" | "desc";
  onSort: (key: K) => void;
};

const SortableHeaderCell = <K extends string,>({
  label,
  sortKey,
  center,
  isActive,
  sortDir,
  onSort,
}: SortableHeaderCellProps<K>) => {
  const isSortable = sortKey !== null;

  const handleClick = (): void => {
    if (sortKey !== null) onSort(sortKey);
  };

  return (
    <th
      className={`px-4 py-3 whitespace-nowrap select-none ${
        center ? "text-center" : "text-start"
      } ${isSortable ? "cursor-pointer hover:text-primary transition-colors" : ""} ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
      style={{ fontSize: 12 }}
      onClick={handleClick}
    >
      <span className={`inline-flex items-center gap-1.5 ${center ? "justify-center" : ""}`}>
        {label}
        {isSortable &&
          isActive &&
          (sortDir === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          ))}
        {isSortable && !isActive && <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
};

export default SortableHeaderCell;
