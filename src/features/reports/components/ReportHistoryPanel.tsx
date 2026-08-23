import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { History, Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbReportHistory } from "@/shared/hooks";
import { cardCls } from "../styles";
import ReportHistoryItem from "./ReportHistoryItem";

interface IReportHistoryPanelProps {
  history: DbReportHistory[];
  loading: boolean;
}

const MAX_VISIBLE_ENTRIES = 20;

const ReportHistoryPanel = ({ history, loading }: IReportHistoryPanelProps) => {
  const visibleEntries = useMemo(() => history.slice(0, MAX_VISIBLE_ENTRIES), [history]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cardCls}
    >
      <h3 className="text-foreground mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        {arabicSource("reports.log_of_generated_reports")}
      </h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : visibleEntries.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          {arabicSource("reports.no_reports_have_been_generated_yet")}
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {visibleEntries.map((entry) => (
            <ReportHistoryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default memo(ReportHistoryPanel);
