import type { DashboardKpiSection } from "../types";
import { dashboardKpiTabs } from "../data";
import DashboardKpiTabButton from "./DashboardKpiTabButton";

type DashboardKpiTabsProps = {
  activeSection: DashboardKpiSection;
  onSectionChange: (section: DashboardKpiSection) => void;
};

const DashboardKpiTabs = ({
  activeSection,
  onSectionChange,
}: DashboardKpiTabsProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
    {dashboardKpiTabs.map((tab) => (
      <DashboardKpiTabButton
        key={tab.key}
        tabKey={tab.key}
        label={tab.label}
        icon={tab.icon}
        isActive={activeSection === tab.key}
        onSectionChange={onSectionChange}
      />
    ))}
  </div>
);

export default DashboardKpiTabs;
