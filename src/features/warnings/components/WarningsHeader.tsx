import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { WarningViewMode } from "../types";

type WarningsHeaderProps = {
  viewMode: WarningViewMode;
  onViewModeChange: (mode: WarningViewMode) => void;
  onNewWarning: () => void;
};

const WarningsHeader = ({ viewMode, onViewModeChange, onNewWarning }: WarningsHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.alarms")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("warnings.managing_and_following_up_on_administrative_warnings")}</p>
    </div>
    <div className="flex items-center gap-3">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewWarning}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        {arabicSource("warnings.issue_an_alarm")}
      </motion.button>
    </div>
  </div>
);

export default WarningsHeader;
