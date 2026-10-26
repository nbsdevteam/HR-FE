import { arabicSource } from "@/i18n/source";
import { formatNumber } from "@/i18n/format";
import EmployeeLifecycleCountRow from "./EmployeeLifecycleCountRow";

export type LifecycleCountRow = { key: string; label: string; value: number };

type EmployeeLifecycleCountsProps = {
  title: string;
  rows: readonly LifecycleCountRow[];
};

/** A titled list of backend counts (documents or custody). */
const EmployeeLifecycleCounts = ({ title, rows }: EmployeeLifecycleCountsProps) => (
  <section className="rounded-xl border border-border/40 bg-card/30 p-4" data-lifecycle-counts={title}>
    <h4 className="text-foreground mb-3" style={{ fontSize: 14 }}>{title}</h4>
    {rows.length === 0 ? (
      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.no_data")}</p>
    ) : (
      <ul className="space-y-1.5">
        {rows.map(row => (
          <EmployeeLifecycleCountRow key={row.key} label={row.label} value={formatNumber(row.value)} />
        ))}
      </ul>
    )}
  </section>
);

export default EmployeeLifecycleCounts;
