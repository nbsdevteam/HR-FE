import type { DashboardKpiSection } from "../types";
import { getDashboardKpiTabs } from "../utils/dashboardTabs";
import DashboardKpiTabButton from "./DashboardKpiTabButton";

type DashboardKpiTabsProps = {
  activeSection: DashboardKpiSection;
  onSectionChange: (section: DashboardKpiSection) => void;
};

const DashboardKpiTabs = ({ activeSection, onSectionChange }: DashboardKpiTabsProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
    {getDashboardKpiTabs().map((tab) => (
      <DashboardKpiTabButton
        key={tab.key}
        tabKey={tab.key}
        label={tab.label}
        icon={tab.icon}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />
    ))}
  </div>
);

export default DashboardKpiTabs;
