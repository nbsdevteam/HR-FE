import { arabicSource } from "@/i18n/source";
import { formatDateTime } from "@/i18n/format";
import type { DbReportHistory } from "@/shared/hooks";

type ReportHistoryItemProps = {
  entry: DbReportHistory;
};

export const ReportHistoryItem = ({ entry }: ReportHistoryItemProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
    <div>
      <p className="text-sm text-foreground">{entry.report_name}</p>
      <p className="text-xs text-muted-foreground">{entry.row_count} {arabicSource("reports.register_by")} {entry.generated_by}</p>
    </div>
    <span className="text-xs text-muted-foreground" dir="ltr">{formatDateTime(entry.generated_at)}</span>
  </div>
);
