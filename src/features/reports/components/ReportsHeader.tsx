import { memo } from "react";
import { History } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

interface IReportsHeaderProps {
  showHistory: boolean;
  onToggleHistory: () => void;
}

const ReportsHeader = ({
  showHistory,
  onToggleHistory,
}: IReportsHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.reports")}</h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource("reports.reporting_engine_live_data_from_the_database")}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant={showHistory ? "primary" : "outline"}
        icon={History}
        onClick={onToggleHistory}
        className="cursor-pointer"
      >
        {arabicSource("reports.report_log")}
      </Button>
    </div>
  </div>
);

export default memo(ReportsHeader);
