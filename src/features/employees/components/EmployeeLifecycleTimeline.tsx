import type { LifecycleTimelineEntry } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import EmployeeLifecycleTimelineItem from "./EmployeeLifecycleTimelineItem";

type EmployeeLifecycleTimelineProps = {
  entries: LifecycleTimelineEntry[];
};

const EmployeeLifecycleTimeline = ({ entries }: EmployeeLifecycleTimelineProps) => (
  <section className="rounded-xl border border-border/40 bg-card/30 p-4" data-lifecycle-timeline>
    <h4 className="text-foreground mb-3" style={{ fontSize: 14 }}>{arabicSource("employees.lifecycle_timeline")}</h4>
    {entries.length === 0 ? (
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("employees.lifecycle_no_timeline")}</p>
    ) : (
      <ol>
        {entries.map(entry => (
          <EmployeeLifecycleTimelineItem key={entry.id} entry={entry} />
        ))}
      </ol>
    )}
  </section>
);

export default EmployeeLifecycleTimeline;
