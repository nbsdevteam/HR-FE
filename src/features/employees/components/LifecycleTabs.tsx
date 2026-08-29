import { TabButton, TabGroup } from "@/shared/components";
import { lifecycleTabs, type LifecycleTabId } from "../types/lifecycle";

type LifecycleTabsProps = {
  activeTab: LifecycleTabId;
  onTabChange: (tab: LifecycleTabId) => void;
};

const LifecycleTabs = ({ activeTab, onTabChange }: LifecycleTabsProps) => (
  <TabGroup>
    {lifecycleTabs.map(tab => (
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

export default LifecycleTabs;
