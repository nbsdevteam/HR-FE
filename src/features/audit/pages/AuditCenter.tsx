import { useState } from "react";
import { arabicSource } from "@/i18n/source";
import AuditCenterTabs from "../components/AuditCenterTabs";
import AuditTrailTab from "../components/AuditTrailTab";
import NotificationsTab from "../components/NotificationsTab";
import type { AuditTabId } from "../types";

const AuditCenter = () => {
  const [activeTab, setActiveTab] = useState<AuditTabId>("notifications");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-gold">{arabicSource("auditcenter.notifications_and_logs_center")}</h1>
        <p className="text-muted-foreground mt-1">{arabicSource("auditcenter.notifications_and_audit_log_for_all_operations")}</p>
      </div>

      <AuditCenterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "notifications" ? <NotificationsTab /> : <AuditTrailTab />}
    </div>
  );
};

export default AuditCenter;
