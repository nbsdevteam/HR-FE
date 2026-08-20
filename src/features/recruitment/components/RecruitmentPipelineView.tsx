import { useMemo, memo } from "react";
import type { DbApplicant } from "@/shared/hooks";
import { STAGES } from "../constants/recruitment";
import PipelineColumn from "./PipelineColumn";

type RecruitmentPipelineViewProps = {
  applicants: DbApplicant[];
  onSelectApplicant: (applicant: DbApplicant) => void;
};

const RecruitmentPipelineView = ({ applicants, onSelectApplicant }: RecruitmentPipelineViewProps) => {
  const applicantsByStage = useMemo(() => {
    const map = new Map<string, DbApplicant[]>();
    for (const applicant of applicants) {
      const list = map.get(applicant.stage);
      if (list) list.push(applicant);
      else map.set(applicant.stage, [applicant]);
    }
    return map;
  }, [applicants]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {STAGES.map((stage, stageIndex) => (
        <PipelineColumn
          key={stage}
          stage={stage}
          index={stageIndex}
          applicants={applicantsByStage.get(stage) || []}
          onSelectApplicant={onSelectApplicant}
        />
      ))}
    </div>
  );
};

export default memo(RecruitmentPipelineView);
