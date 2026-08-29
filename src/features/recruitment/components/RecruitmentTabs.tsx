import { memo } from "react";
import { TabButton, TabGroup } from "@/shared/components";
import { recruitmentTabsData } from "../data";

type RecruitmentView = "jobs" | "applicants" | "pipeline" | "bank" | "ai";

interface IRecruitmentTabsProps {
  view: RecruitmentView;
  onViewChange: (view: RecruitmentView) => void;
}

const RecruitmentTabs = ({ view, onViewChange }: IRecruitmentTabsProps) => (
  <TabGroup>
    {recruitmentTabsData.map((tab) => (
      <TabButton
        key={tab.id}
        id={tab.id}
        label={tab.label}
        icon={tab.icon}
        isActive={view === tab.id}
        onSelect={onViewChange}
      />
    ))}
  </TabGroup>
);

export default memo(RecruitmentTabs);
