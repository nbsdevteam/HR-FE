import type { ElementType } from "react";
import type { DeviceManagementTab } from "../types";

type DeviceManagementTabButtonProps = {
  tabKey: DeviceManagementTab;
  label: string;
  icon: ElementType;
  activeTab: DeviceManagementTab;
  onTabChange: (tab: DeviceManagementTab) => void;
};

const DeviceManagementTabButton = ({
  tabKey,
  label,
  icon: Icon,
  activeTab,
  onTabChange,
}: DeviceManagementTabButtonProps) => (
  <button
    onClick={() => onTabChange(tabKey)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
      activeTab === tabKey
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default DeviceManagementTabButton;
