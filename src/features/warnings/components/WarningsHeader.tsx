import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import ViewToggle from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { WarningViewMode } from "../types";

type TWarningsHeaderProps = {
  viewMode: WarningViewMode;
  onViewModeChange: (mode: WarningViewMode) => void;
  onNewWarning: () => void;
};

const WarningsHeader = ({
  viewMode,
  onViewModeChange,
  onNewWarning,
}: TWarningsHeaderProps) => (
  <div className="flex flex-col min-[930px]:flex-row items-start min-[930px]:items-center justify-between gap-4">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.alarms")}</h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource(
          "warnings.managing_and_following_up_on_administrative_warnings",
        )}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <Button
        variant="primary"
        size="lg"
        icon={Plus}
        onClick={onNewWarning}
        className="px-6 py-3 shadow-lg shadow-primary/20 cursor-pointer"
      >
        {arabicSource("warnings.issue_an_alarm")}
      </Button>
    </div>
  </div>
);

export default memo(WarningsHeader);
