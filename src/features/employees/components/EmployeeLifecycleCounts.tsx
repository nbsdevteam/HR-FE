import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { formatNumber } from "@/i18n/format";
import { TOTAL_COUNT_KEY, TOTAL_COUNT_LABEL_KEY } from "../utils/lifecycleActions";
import EmployeeLifecycleCountRow from "./EmployeeLifecycleCountRow";

type EmployeeLifecycleCountsProps = {
  title: string;
  counts: Record<string, number>;
  labelFor: (bucket: string) => string;
};

/** A titled list of backend counts (documents or custody), the total first. */
const EmployeeLifecycleCounts = ({ title, counts, labelFor }: EmployeeLifecycleCountsProps) => {
  const buckets = useMemo(
    () => Object.entries(counts).sort(([a], [b]) => Number(b === TOTAL_COUNT_KEY) - Number(a === TOTAL_COUNT_KEY)),
    [counts],
  );

  return (
    <section className="rounded-xl border border-border/40 bg-card/30 p-4" data-lifecycle-counts={title}>
      <h4 className="text-foreground mb-3" style={{ fontSize: 14 }}>{title}</h4>
      {buckets.length === 0 ? (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.no_data")}</p>
      ) : (
        <ul className="space-y-1.5">
          {buckets.map(([bucket, count]) => (
            <EmployeeLifecycleCountRow
              key={bucket}
              label={bucket === TOTAL_COUNT_KEY ? arabicSource(TOTAL_COUNT_LABEL_KEY) : labelFor(bucket)}
              value={formatNumber(count)}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default EmployeeLifecycleCounts;
