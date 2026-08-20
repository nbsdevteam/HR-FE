import { useCallback, memo } from "react";
import { recruitmentTabsData } from "../data";
import RecruitmentTabButton from "./RecruitmentTabButton";

type RecruitmentView = "jobs" | "applicants" | "pipeline" | "bank" | "ai";

type RecruitmentTabsProps = {
  view: RecruitmentView;
  onViewChange: (view: RecruitmentView) => void;
};

const RecruitmentTabs = ({ view, onViewChange }: RecruitmentTabsProps) => {
  const handleSelect = useCallback(
    (id: string) => onViewChange(id as RecruitmentView),
    [onViewChange],
  );

  return (
    <div className="flex gap-2 flex-wrap">
      {recruitmentTabsData.map((tab) => (
        <RecruitmentTabButton key={tab.id} id={tab.id} label={tab.label} isActive={view === tab.id} onSelect={handleSelect} />
      ))}
    </div>
  );
};

export default memo(RecruitmentTabs);
