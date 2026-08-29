import { Bell } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import DashboardChartCard from "./DashboardChartCard";
import DashboardNotificationRow from "./DashboardNotificationRow";

type DashboardNotificationsPanelProps = {
  notifications: any[];
  notificationsPreview: any[];
  unreadCount: number;
  cardCls: string;
};

const DashboardNotificationsPanel = ({
  notifications,
  notificationsPreview,
  unreadCount,
  cardCls,
}: DashboardNotificationsPanelProps) => (
  <DashboardChartCard delay={0.9} className={cardCls}>
    <h3 className="text-foreground mb-4 flex items-center gap-2">
      <Bell className="w-4 h-4 text-primary" />{" "}
      {arabicSource("dashboard.latest_notices")}
      {unreadCount > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
          {unreadCount}
        </span>
      )}
    </h3>
    <div className="space-y-2.5">
      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {arabicSource("common.no_notifications")}
        </p>
      ) : (
        notificationsPreview.map((n: any) => (
          <DashboardNotificationRow key={n.id} notification={n} />
        ))
      )}
    </div>
  </DashboardChartCard>
);

export default DashboardNotificationsPanel;
