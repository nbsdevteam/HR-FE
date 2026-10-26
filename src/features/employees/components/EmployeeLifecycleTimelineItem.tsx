import type { LifecycleTimelineEntry } from "@/shared/hooks";

type EmployeeLifecycleTimelineItemProps = {
  entry: LifecycleTimelineEntry;
};

const EmployeeLifecycleTimelineItem = ({ entry }: EmployeeLifecycleTimelineItemProps) => (
  <li className="relative ps-4 pb-3 border-s border-border/40 last:pb-0" data-timeline-kind={entry.kind || undefined}>
    <span className="absolute -start-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
    <p className="text-foreground" style={{ fontSize: 13 }} dir="auto">{entry.title}</p>
    {entry.detail && <p className="text-muted-foreground" style={{ fontSize: 12 }} dir="auto">{entry.detail}</p>}
    {entry.at && <p className="text-muted-foreground/70" style={{ fontSize: 11 }} dir="ltr">{entry.at}</p>}
  </li>
);

export default EmployeeLifecycleTimelineItem;
