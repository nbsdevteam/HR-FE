import { memo, useCallback } from "react";
import { getRatingInfo } from "../../utils/evaluationHelpers";
import CriterionRow from "./CriterionRow";
import StarScoreButtons from "./StarScoreButtons";

type NewEvalCriterionRowProps = {
  criterion: string;
  score: number;
  onScoreChange: (criterion: string, value: number) => void;
};

const NewEvalCriterionRow = ({ criterion, score, onScoreChange }: NewEvalCriterionRowProps) => {
  const ratingInfo = getRatingInfo(score);

  const handleScoreChange = useCallback(
    (value: number): void => {
      onScoreChange(criterion, value);
    },
    [criterion, onScoreChange],
  );

  return (
    <CriterionRow name={criterion}>
      <div className="flex items-center gap-1.5">
        <StarScoreButtons score={score} onChange={handleScoreChange} />
        <span className={`px-1.5 py-0.5 rounded border ms-1 ${ratingInfo.bgColor}`} style={{ fontSize: 9 }}>
          {score}
        </span>
      </div>
    </CriterionRow>
  );
};

export default memo(NewEvalCriterionRow);
