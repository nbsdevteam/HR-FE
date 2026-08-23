import { NodeAvatar, StatusBadge } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { defaultCriteria as DEFAULT_CRITERIA } from "../types";
import { getRatingInfo, renderStars } from "../utils/evaluationHelpers";
import CriterionRow from "./shared/CriterionRow";
import StarScoreButtons from "./shared/StarScoreButtons";
import EvaluationSaveActions from "./shared/EvaluationSaveActions";

type NewEvalStepTwoProps = {
  selectedEmp: DbEmployee | null;
  evaluatorEmp: DbEmployee | null;
  period: string;
  overallRating: number;
  scores: Record<string, number>;
  onScoreChange: (criterion: string, value: number) => void;
  comments: string;
  onCommentsChange: (comments: string) => void;
  saving: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onComplete: () => void;
  onCancel: () => void;
};

const NewEvalStepTwo = ({
  selectedEmp, evaluatorEmp, period, overallRating, scores, onScoreChange,
  comments, onCommentsChange, saving, onBack, onSaveDraft, onComplete, onCancel,
}: NewEvalStepTwoProps) => {
  const handleScoreChange = (criterion: string) => (v: number): void => {
    onScoreChange(criterion, v);
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onCommentsChange(e.target.value);
  };

  return (
  <div className="space-y-4">
    {/* Employee Info Summary */}
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
      <NodeAvatar
        name={selectedEmp ? empDisplayName(selectedEmp) : "?"}
        initials={selectedEmp ? empDisplayName(selectedEmp).charAt(0) : "?"}
        sizeClassName="w-10 h-10"
        extraClassName="border border-primary/30"
        fallbackClassName="bg-primary/20"
        textClassName="text-primary"
        fontSize={14}
      />
      <div className="flex-1">
        <p className="text-foreground">{selectedEmp ? empDisplayName(selectedEmp) : "—"}</p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>
          {selectedEmp?.department} — {period}
          {evaluatorEmp && ` ${arabicSource("evaluation.assessor")} ${empDisplayName(evaluatorEmp)}`}
        </p>
      </div>
      <button
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        style={{ fontSize: 11 }}
      >
        {arabicSource("evaluation.change")}
      </button>
    </div>

    {/* Overall Rating Preview */}
    <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/15">
      <div className="flex justify-center mb-1">{renderStars(overallRating)}</div>
      <StatusBadge colorClassName={getRatingInfo(overallRating).bgColor} fontSize={11} extraClassName="inline-block">
        {getRatingInfo(overallRating).label}
      </StatusBadge>
      <p className="text-muted-foreground mt-1" style={{ fontSize: 10 }}>{arabicSource("evaluation.auto_average")}</p>
    </div>

    {/* Criteria Scoring */}
    <div className="space-y-2">
      <label className="text-foreground block" style={{ fontSize: 13 }}>{arabicSource("evaluation.evaluation_criteria")}</label>
      {DEFAULT_CRITERIA.map(criterion => {
        const score = scores[criterion] || 3;
        const cRatingInfo = getRatingInfo(score);
        return (
          <CriterionRow key={criterion} name={criterion}>
            <div className="flex items-center gap-1.5">
              <StarScoreButtons score={score} onChange={handleScoreChange(criterion)} />
              <span className={`px-1.5 py-0.5 rounded border ms-1 ${cRatingInfo.bgColor}`} style={{ fontSize: 9 }}>
                {score}
              </span>
            </div>
          </CriterionRow>
        );
      })}
    </div>

    {/* Comments */}
    <div>
      <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.notes")}</label>
      <textarea
        rows={3}
        value={comments}
        onChange={handleCommentsChange}
        placeholder={arabicSource("common.observations_about_the_employee_s_performance")}
        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
      />
    </div>

    {/* Actions */}
    <EvaluationSaveActions saving={saving} onSaveDraft={onSaveDraft} onComplete={onComplete} />
    <button
      onClick={onCancel}
      className="w-full h-10 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
    >
      {arabicSource("common.cancel")}
    </button>
  </div>
  );
};

export default NewEvalStepTwo;
