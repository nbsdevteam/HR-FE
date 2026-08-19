import { Loader2, Save, CheckCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type EvaluationSaveActionsProps = {
  saving: boolean;
  onSaveDraft: () => void;
  onComplete: () => void;
};

const EvaluationSaveActions = ({ saving, onSaveDraft, onComplete }: EvaluationSaveActionsProps) => (
  <div className="flex gap-3">
    <button
      onClick={onSaveDraft}
      disabled={saving}
      className="flex-1 h-11 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {arabicSource("common.save_as_draft")}
    </button>
    <button
      onClick={onComplete}
      disabled={saving}
      className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      {arabicSource("common.complete_the_assessment")}
    </button>
  </div>
);

export default EvaluationSaveActions;
