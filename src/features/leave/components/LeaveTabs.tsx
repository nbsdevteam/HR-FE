import { TabButton, TabGroup } from "@/shared/components";
import { leaveTabs, type LeaveTabId } from "../types";

type LeaveTabsProps = {
  activeTab: LeaveTabId;
  onTabChange: (tabId: LeaveTabId) => void;
};

const LeaveTabs = ({ activeTab, onTabChange }: LeaveTabsProps) => (
  <TabGroup>
    {leaveTabs.map((tab) => (
      <TabButton
        key={tab.id}
        id={tab.id}
        label={tab.label}
        icon={tab.icon}
        isActive={activeTab === tab.id}
        onSelect={onTabChange}
      />
    ))}
  </TabGroup>
);

export default LeaveTabs;
