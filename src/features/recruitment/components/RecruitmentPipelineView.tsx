import { useMemo, useState, useCallback, memo } from "react";
import type { DbApplicant } from "@/shared/hooks";
import { groupBy } from "@/shared/utils/collections";
import { STAGES } from "../constants/recruitment";
import PipelineColumn from "./PipelineColumn";

const EMPTY_APPLICANTS: DbApplicant[] = [];

type RecruitmentPipelineViewProps = {
  applicants: DbApplicant[];
  onSelectApplicant: (applicant: DbApplicant) => void;
  onUpdateStage: (id: string, stage: string) => void;
};

const RecruitmentPipelineView = ({ applicants, onSelectApplicant, onUpdateStage }: RecruitmentPipelineViewProps) => {
  const [draggingApplicantId, setDraggingApplicantId] = useState<string | null>(null);

  const applicantsByStage = useMemo(
    () => groupBy(applicants, (applicant) => applicant.stage),
    [applicants],
  );

  const handleDragStateChange = useCallback((applicantId: string | null): void => {
    setDraggingApplicantId(applicantId);
  }, []);

  const handleDropApplicant = useCallback(
    (applicantId: string, stage: string): void => {
      onUpdateStage(applicantId, stage);
    },
    [onUpdateStage],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {STAGES.map((stage, stageIndex) => (
        <PipelineColumn
          key={stage}
          stage={stage}
          index={stageIndex}
          applicants={applicantsByStage.get(stage) || EMPTY_APPLICANTS}
          isDragActive={draggingApplicantId !== null}
          onSelectApplicant={onSelectApplicant}
          onDragStateChange={handleDragStateChange}
          onDropApplicant={handleDropApplicant}
        />
      ))}
    </div>
  );
};

export default memo(RecruitmentPipelineView);
