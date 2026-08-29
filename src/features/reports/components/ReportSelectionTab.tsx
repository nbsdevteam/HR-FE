import { memo, useCallback } from "react";
import { Button } from "@/shared/components";
import type { ReportSelectionTabId } from "../types";

type ReportSelectionTabProps = {
  id: ReportSelectionTabId;
  label: string;
  count: number;
  active: boolean;
  onSelect: (id: ReportSelectionTabId) => void;
};

/** Modal section switch carrying a live count of what that section has selected. */
const ReportSelectionTab = ({ id, label, count, active, onSelect }: ReportSelectionTabProps) => {
  const handleSelect = useCallback((): void => {
    onSelect(id);
  }, [onSelect, id]);

  return (
    <Button
      variant="chip"
      size="unstyled"
      rounded="rounded-lg"
      active={active}
      aria-pressed={active}
      onClick={handleSelect}
      className="gap-2 px-4 py-2"
      style={{ fontSize: 13 }}
    >
      {label}
      <span
        className={`px-1.5 rounded-md ${
          active ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
        }`}
        style={{ fontSize: 11 }}
      >
        {count}
      </span>
    </Button>
  );
};

export default memo(ReportSelectionTab);
