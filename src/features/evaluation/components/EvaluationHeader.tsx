import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";
import ViewToggle from "@/shared/components/ViewToggle";
import { arabicSource } from "@/i18n/source";
import type { EvaluationViewMode } from "../types";

type EvaluationHeaderProps = {
  viewMode: EvaluationViewMode;
  onViewModeChange: (viewMode: EvaluationViewMode) => void;
  onNewEvaluation: () => void;
};

const EvaluationHeader = ({ viewMode, onViewModeChange, onNewEvaluation }: EvaluationHeaderProps) => (
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-gradient-gold">{arabicSource("common.performance_evaluation")}</h1>
      <p className="text-muted-foreground mt-1">{arabicSource("evaluation.five_point_performance_scale_evaluation_system_the_line_manager")}</p>
    </div>
    <div className="flex items-center gap-3">
      <ViewToggle view={viewMode} onChange={onViewModeChange} />
      <Button
        variant="primary"
        size="lg"
        icon={Plus}
        onClick={onNewEvaluation}
        className="px-6 py-3 shadow-lg shadow-primary/20 cursor-pointer"
      >
        {arabicSource("evaluation.new_evaluation")}
      </Button>
    </div>
  </div>
);

export default memo(EvaluationHeader);
