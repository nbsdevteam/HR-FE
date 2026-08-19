import { Bell, Shield } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { AuditTabId } from "../types";
import AuditTabButton from "./AuditTabButton";
import { tabs } from "../data/auditMeta";

type AuditCenterTabsProps = {
  activeTab: AuditTabId;
  onTabChange: (tab: AuditTabId) => void;
};

const AuditCenterTabs = ({ activeTab, onTabChange }: AuditCenterTabsProps) => {

  return (
    <div className="flex gap-2 border-b border-border/40 pb-1">
      {tabs.map((tab) => (
        <AuditTabButton
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onClick={onTabChange}
        />
      ))}
    </div>
  );
};

export default AuditCenterTabs;
