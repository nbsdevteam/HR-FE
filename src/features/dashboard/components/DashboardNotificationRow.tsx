import { Bell } from "lucide-react";
import { formatDateTime } from "@/i18n/format";

type DashboardNotificationRowProps = {
  notification: {
    id: string | number;
    title: string;
    created_at: string;
    type?: string;
    is_read?: boolean;
  };
};

const DashboardNotificationRow = ({ notification }: DashboardNotificationRowProps) => (
  <div className={`flex items-start gap-3 p-2.5 rounded-lg ${notification.is_read ? "bg-muted/10" : "bg-primary/5 border border-primary/20"}`}>
    <Bell className={`w-3.5 h-3.5 mt-0.5 ${notification.type === "warning" ? "text-amber-400" : notification.type === "error" ? "text-red-400" : "text-primary"}`} />
    <div className="flex-1 min-w-0">
      <p className="text-foreground truncate" style={{ fontSize: 12 }}>{notification.title}</p>
      <p className="text-muted-foreground" style={{ fontSize: 10 }}>{formatDateTime(notification.created_at)}</p>
    </div>
  </div>
);

export default DashboardNotificationRow;
