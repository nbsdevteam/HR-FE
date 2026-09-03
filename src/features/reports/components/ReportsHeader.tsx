import { memo } from "react";
import { History, Settings } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

interface IReportsHeaderProps {
  showHistory: boolean;
  onToggleHistory: () => void;
  canManage?: boolean;
  onOpenManagement?: () => void;
}

const ReportsHeader = ({
  showHistory,
  onToggleHistory,
  canManage = false,
  onOpenManagement,
}: IReportsHeaderProps) => (
  <div className="flex flex-col min-[1000px]:flex-row items-start min-[1000px]:items-center justify-between gap-4">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.reports")}</h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource("reports.reporting_engine_live_data_from_the_database")}
      </p>
    </div>
    <div className="flex items-center gap-2">
      {canManage && onOpenManagement && (
        <Button
          variant="outline"
          icon={Settings}
          onClick={onOpenManagement}
          className="cursor-pointer"
        >
          {arabicSource("reports.manage_configurations")}
        </Button>
      )}
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
