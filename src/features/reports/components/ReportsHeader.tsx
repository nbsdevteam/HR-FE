import { History } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type ReportsHeaderProps = {
  showHistory: boolean;
  onToggleHistory: () => void;
};

export const ReportsHeader = ({ showHistory, onToggleHistory }: ReportsHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.reports")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("reports.reporting_engine_live_data_from_the_database")}</p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleHistory}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${showHistory ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
      >
        <History className="w-4 h-4" />
        {arabicSource("reports.report_log")}
      </button>
    </div>
  </div>
);
