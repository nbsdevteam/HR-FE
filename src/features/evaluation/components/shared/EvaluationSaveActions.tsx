import { Save, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type EvaluationSaveActionsProps = {
  saving: boolean;
  onSaveDraft: () => void;
  onComplete: () => void;
};

const EvaluationSaveActions = ({ saving, onSaveDraft, onComplete }: EvaluationSaveActionsProps) => (
  <div className="flex gap-3">
    <Button
      variant="outline"
      icon={Save}
      loading={saving}
      onClick={onSaveDraft}
      className="flex-1 h-11 cursor-pointer"
    >
      {arabicSource("common.save_as_draft")}
    </Button>
    <Button
      variant="primary"
      icon={CheckCircle}
      loading={saving}
      onClick={onComplete}
      className="flex-1 h-11 shadow-lg shadow-primary/20 cursor-pointer"
    >
      {arabicSource("common.complete_the_assessment")}
    </Button>
  </div>
);

export default EvaluationSaveActions;
