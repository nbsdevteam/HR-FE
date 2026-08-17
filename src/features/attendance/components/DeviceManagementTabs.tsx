import type { DeviceManagementTab } from "../types";
import { getDeviceManagementTabs } from "../utils/deviceManagement";
import DeviceManagementTabButton from "./DeviceManagementTabButton";

type DeviceManagementTabsProps = {
  activeTab: DeviceManagementTab;
  onTabChange: (tab: DeviceManagementTab) => void;
};

const DeviceManagementTabs = ({ activeTab, onTabChange }: DeviceManagementTabsProps) => (
  <div className="flex gap-1 p-1 bg-card/30 backdrop-blur-md rounded-xl border border-border/20 w-fit">
    {getDeviceManagementTabs().map((tab) => (
      <DeviceManagementTabButton
        key={tab.key}
        tabKey={tab.key}
        label={tab.label}
        icon={tab.icon}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    ))}
  </div>
);

export default DeviceManagementTabs;
