import { memo, useCallback } from "react";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { PublicLeaveEmployeeSearchResult } from "../types/publicLeave";

type PublicLeaveEmployeeSearchResultRowProps = {
  employee: PublicLeaveEmployeeSearchResult;
  selected: boolean;
  onSelect: (employeeId: number) => void;
};

/**
 * One search result. Department + job title are always visible (not a
 * tooltip) — two people can share a name, and picking the wrong row files
 * somebody else's leave (backend hand-off §3).
 */
const PublicLeaveEmployeeSearchResultRow = ({
  employee,
  selected,
  onSelect,
}: PublicLeaveEmployeeSearchResultRowProps) => {
  const { primary } = useLocalizedName(employee.name_ar, employee.name);

  const handleClick = useCallback((): void => {
    onSelect(employee.id);
  }, [employee.id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-start px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="text-foreground" style={{ fontSize: 14 }} data-i18n-ignore>{primary}</div>
      <div className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }} data-i18n-ignore>
        {employee.department}
        {employee.department && employee.job_title ? " — " : ""}
        {employee.job_title}
      </div>
    </button>
  );
};

export default memo(PublicLeaveEmployeeSearchResultRow);
