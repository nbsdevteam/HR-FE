import { memo } from "react";
import type { ExitWaitingOn } from "@/shared/hooks";
import { exitWaitingOnLabel } from "../utils/exitProgress";

type ExitWaitingOnChipProps = {
  entry: ExitWaitingOn;
  categoryLabels: Record<string, string>;
};

/** One owner the process waits on; the open approval step shows the approvers' names. */
const ExitWaitingOnChip = ({ entry, categoryLabels }: ExitWaitingOnChipProps) => (
  <span
    className="inline-block px-2 py-0.5 rounded-md border border-border/40 bg-muted/20 text-foreground"
    style={{ fontSize: 11 }}
    dir="auto"
    data-exit-owner={entry.owner}
  >
    {exitWaitingOnLabel(entry, categoryLabels)}
  </span>
);

export default memo(ExitWaitingOnChip);
