import { TabButton, TabGroup } from "@/shared/components";
import { payrollTabs, type PayrollTabId } from "../types";

type PayrollTabsProps = {
  activeTab: PayrollTabId;
  onTabChange: (tabId: PayrollTabId) => void;
};

const PayrollTabs = ({ activeTab, onTabChange }: PayrollTabsProps) => (
  <TabGroup>
    {payrollTabs.map((tab) => (
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

export default PayrollTabs;
