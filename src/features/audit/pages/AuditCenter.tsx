import { lazy, Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import AuditCenterTabs from "../components/AuditCenterTabs";
import NotificationsTab from "../components/NotificationsTab";
import type { AuditTabId } from "../types";

const AuditTrailTab = lazy(() => import("../components/AuditTrailTab"));

const TabFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const AuditCenter = () => {
  const [activeTab, setActiveTab] = useState<AuditTabId>("notifications");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient-gold">
          {arabicSource("auditcenter.notifications_and_logs_center")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {arabicSource(
            "auditcenter.notifications_and_audit_log_for_all_operations",
          )}
        </p>
      </div>

      <AuditCenterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "notifications" ? (
        <NotificationsTab />
      ) : (
        <Suspense fallback={<TabFallback />}>
          <AuditTrailTab />
        </Suspense>
      )}
    </div>
  );
};

export default AuditCenter;
