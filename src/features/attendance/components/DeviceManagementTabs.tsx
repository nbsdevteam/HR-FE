import { TabButton } from "@/shared/components";
import type { DeviceManagementTab } from "../types";
import { DEVICE_MANAGEMENT_TABS } from "../utils/deviceManagement";

type DeviceManagementTabsProps = {
  activeTab: DeviceManagementTab;
  onTabChange: (tab: DeviceManagementTab) => void;
};

const DeviceManagementTabs = ({
  activeTab,
  onTabChange,
}: DeviceManagementTabsProps) => (
  <div className="flex flex-wrap gap-1 p-1 bg-card/30 backdrop-blur-md rounded-xl border border-border/20 w-fit">
    {DEVICE_MANAGEMENT_TABS.map((tab) => (
      <TabButton
        key={tab.key}
        id={tab.key}
        label={tab.label}
        icon={tab.icon}
        isActive={activeTab === tab.key}
        onSelect={onTabChange}
      />
    ))}
  </div>
);

export default DeviceManagementTabs;
