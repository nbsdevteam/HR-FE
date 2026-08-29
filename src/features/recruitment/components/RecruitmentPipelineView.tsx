import { useMemo, memo } from "react";
import type { DbApplicant } from "@/shared/hooks";
import { groupBy } from "@/shared/utils/collections";
import { STAGES } from "../constants/recruitment";
import PipelineColumn from "./PipelineColumn";

const EMPTY_APPLICANTS: DbApplicant[] = [];

type RecruitmentPipelineViewProps = {
  applicants: DbApplicant[];
  onSelectApplicant: (applicant: DbApplicant) => void;
};

const RecruitmentPipelineView = ({ applicants, onSelectApplicant }: RecruitmentPipelineViewProps) => {
  const applicantsByStage = useMemo(
    () => groupBy(applicants, (applicant) => applicant.stage),
    [applicants],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {STAGES.map((stage, stageIndex) => (
        <PipelineColumn
          key={stage}
          stage={stage}
          index={stageIndex}
          applicants={applicantsByStage.get(stage) || EMPTY_APPLICANTS}
          onSelectApplicant={onSelectApplicant}
        />
      ))}
    </div>
  );
};

export default memo(RecruitmentPipelineView);
