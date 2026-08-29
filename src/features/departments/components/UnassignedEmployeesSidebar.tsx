import { useRef } from "react";
import { SearchInput } from "@/shared/components";
import { useWindowedRows } from "@/shared/hooks/useWindowedRows";
import { arabicSource } from "@/i18n/source";
import type { DbEmployee } from "@/shared/hooks";
import UnassignedEmployeeItem, {
  EMPLOYEE_ITEM_HEIGHT,
} from "./UnassignedEmployeeItem";

const WINDOWING_THRESHOLD = 40;

type UnassignedEmployeesSidebarProps = {
  totalCount: number;
  empSearch: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  filteredUnassigned: DbEmployee[];
  deptColors: Record<string, string>;
  onDragStateChange: (employeeId: string | null) => void;
};

const UnassignedEmployeesSidebar = ({
  totalCount,
  empSearch,
  onSearchChange,
  onClearSearch,
  filteredUnassigned,
  deptColors,
  onDragStateChange,
}: UnassignedEmployeesSidebarProps) => {
  // Declared before the windowing hook because that hook measures against it.
  const scrollRef = useRef<HTMLDivElement>(null);

  const { containerRef, startIndex, endIndex, topPadding, bottomPadding } =
    useWindowedRows<HTMLDivElement>({
      rowCount: filteredUnassigned.length,
      rowHeight: EMPLOYEE_ITEM_HEIGHT,
      threshold: WINDOWING_THRESHOLD,
      scrollParentRef: scrollRef,
    });

  const isWindowed = startIndex > 0 || endIndex < filteredUnassigned.length;

  return (
    <div className="w-72 shrink-0 bg-card/30 border border-border/40 rounded-xl overflow-hidden flex flex-col min-h-0">
      <div className="p-3 border-b border-border/30 shrink-0">
        <h3 className="text-foreground mb-2" style={{ fontSize: 14 }}>
          {arabicSource("hierarchy.employees_without_position")} {totalCount}
        </h3>
        <SearchInput
          iconClassName="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
          inputClassName="w-full bg-background border border-border/40 rounded-lg ps-8 pe-8 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          value={empSearch}
          onChange={onSearchChange}
          onClear={onClearSearch}
          placeholder={arabicSource("common.search")}
          style={{ fontSize: 12 }}
        />
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-2">
        {filteredUnassigned.length > 0 ? (
          <div ref={containerRef}>
            {isWindowed && topPadding > 0 && (
              <div aria-hidden="true" style={{ height: topPadding }} />
            )}
            {filteredUnassigned.slice(startIndex, endIndex).map((emp) => (
              <UnassignedEmployeeItem
                key={emp.id}
                employee={emp}
                deptColors={deptColors}
                onDragStateChange={onDragStateChange}
              />
            ))}
            {isWindowed && bottomPadding > 0 && (
              <div aria-hidden="true" style={{ height: bottomPadding }} />
            )}
          </div>
        ) : (
          <p
            className="text-center text-muted-foreground py-6"
            style={{ fontSize: 12 }}
          >
            {empSearch
              ? arabicSource("common.no_results_found")
              : arabicSource(
                  "hierarchy.all_employees_are_appointed_to_positions",
                )}
          </p>
        )}
      </div>
    </div>
  );
};

export default UnassignedEmployeesSidebar;
