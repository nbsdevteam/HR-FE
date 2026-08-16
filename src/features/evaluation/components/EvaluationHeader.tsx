import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { EvaluationViewMode } from "../types";

type EvaluationHeaderProps = {
  viewMode: EvaluationViewMode;
  onViewModeChange: (viewMode: EvaluationViewMode) => void;
  onNewEvaluation: () => void;
};

export const EvaluationHeader = ({ viewMode, onViewModeChange, onNewEvaluation }: EvaluationHeaderProps) => (
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.performance_evaluation")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("evaluation.five_point_performance_scale_evaluation_system_the_line_manager")}</p>
    </div>
    <div className="flex items-center gap-3">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewEvaluation}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        {arabicSource("evaluation.new_evaluation")}
      </motion.button>
    </div>
  </div>
);
