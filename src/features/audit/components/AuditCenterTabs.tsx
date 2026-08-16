import { Bell, Shield } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { AuditTabId } from "../types";
import { AuditTabButton } from "./AuditTabButton";

type AuditCenterTabsProps = {
  activeTab: AuditTabId;
  onTabChange: (tab: AuditTabId) => void;
};

export function AuditCenterTabs({ activeTab, onTabChange }: AuditCenterTabsProps) {
  const tabs = [
    { key: "notifications" as const, label: arabicSource("common.notices"), icon: Bell },
    { key: "audit" as const, label: arabicSource("auditcenter.audit_log"), icon: Shield },
  ];

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
}
