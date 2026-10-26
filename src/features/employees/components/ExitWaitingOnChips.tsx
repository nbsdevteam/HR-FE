import { memo } from "react";
import type { ExitWaitingOn } from "@/shared/hooks";
import ExitWaitingOnChip from "./ExitWaitingOnChip";

type ExitWaitingOnChipsProps = {
  waitingOn: ExitWaitingOn[];
  categoryLabels: Record<string, string>;
};

/** Everyone the process waits on now; clearance usually has several teams at once. */
const ExitWaitingOnChips = ({ waitingOn, categoryLabels }: ExitWaitingOnChipsProps) => {
  if (waitingOn.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="flex flex-wrap gap-1">
      {waitingOn.map(entry => (
        <ExitWaitingOnChip key={entry.owner} entry={entry} categoryLabels={categoryLabels} />
      ))}
    </span>
  );
};

export default memo(ExitWaitingOnChips);
