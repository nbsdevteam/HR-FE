import { formatDateTime } from "@/i18n/format";
import type { LifecycleTimelineEntry } from "@/shared/hooks";
import { exitStageLabel } from "../utils/lifecycleActions";

type EmployeeLifecycleTimelineItemProps = {
  entry: LifecycleTimelineEntry;
};

const EmployeeLifecycleTimelineItem = ({ entry }: EmployeeLifecycleTimelineItemProps) => (
  <li className="relative ps-4 pb-3 border-s border-border/40 last:pb-0" data-timeline-stage={entry.stage}>
    <span className="absolute -start-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
    <p className="text-foreground" style={{ fontSize: 13 }}>{exitStageLabel(entry.stage)}</p>
    {entry.at && (
      <p className="text-muted-foreground/70" style={{ fontSize: 11 }} dir="ltr">
        {formatDateTime(entry.at, { timeZone: "Asia/Baghdad" })}
      </p>
    )}
  </li>
);

export default EmployeeLifecycleTimelineItem;
