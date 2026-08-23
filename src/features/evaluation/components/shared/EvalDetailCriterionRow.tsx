import { memo, useCallback } from "react";
import { StatusBadge } from "@/shared/components";
import { getRatingInfo, renderStars } from "../../utils/evaluationHelpers";
import CriterionRow from "./CriterionRow";
import StarScoreButtons from "./StarScoreButtons";

type EvalDetailCriterionRowProps = {
  criterion: string;
  score: number;
  editing: boolean;
  onScoreChange: (criterion: string, value: number) => void;
};

const EvalDetailCriterionRow = ({ criterion, score, editing, onScoreChange }: EvalDetailCriterionRowProps) => {
  const ratingInfo = getRatingInfo(score);

  const handleScoreChange = useCallback(
    (value: number): void => {
      onScoreChange(criterion, value);
    },
    [criterion, onScoreChange],
  );

  return (
    <CriterionRow name={criterion}>
      {editing ? (
        <div className="flex items-center gap-2">
          <StarScoreButtons score={score} onChange={handleScoreChange} />
          <StatusBadge colorClassName={ratingInfo.bgColor} fontSize={10} extraClassName="ms-2">{ratingInfo.label}</StatusBadge>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(score)}</div>
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>({score}/5)</span>
        </div>
      )}
    </CriterionRow>
  );
};

export default memo(EvalDetailCriterionRow);
