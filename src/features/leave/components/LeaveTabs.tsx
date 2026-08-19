import { leaveTabs, type LeaveTabId } from "../types";
import LeaveTabButton from "./LeaveTabButton";

type LeaveTabsProps = {
  activeTab: LeaveTabId;
  onTabChange: (tabId: LeaveTabId) => void;
};

const LeaveTabs = ({ activeTab, onTabChange }: LeaveTabsProps) => (
  <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
    {leaveTabs.map((tab) => (
      <LeaveTabButton
        key={tab.id}
        id={tab.id}
        label={tab.label}
        icon={tab.icon}
        isActive={activeTab === tab.id}
        onSelect={onTabChange}
      />
    ))}
  </div>
);

export default LeaveTabs;
