import { memo, useCallback } from "react";
import { CheckCircle, AlertTriangle, CalendarDays } from "lucide-react";
import type { DbNotification } from "@/shared/hooks";

type Notification = DbNotification;

type NotificationItemProps = {
  notification: Notification;
  onSelect: (notification: Notification) => void;
};

const notificationIcon = (type: string) => {
  if (type === "warning" || type === "error") return AlertTriangle;
  if (type === "success") return CheckCircle;
  return CalendarDays;
};

const notificationColor = (type: string) => {
  if (type === "warning") return "text-amber-400";
  if (type === "error") return "text-destructive";
  if (type === "success") return "text-emerald-400";
  return "text-primary";
};

const NotificationItem = ({ notification, onSelect }: NotificationItemProps) => {
  const Icon = notificationIcon(notification.type);

  const handleSelect = useCallback((): void => {
    onSelect(notification);
  }, [onSelect, notification]);

  return (
    <div
      onClick={handleSelect}
      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/10 last:border-b-0 cursor-pointer"
    >
      <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
        <Icon className={`w-4 h-4 ${notificationColor(notification.type)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground" style={{ fontSize: 13 }}>{notification.title}</p>
        {notification.body && <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>{notification.body}</p>}
        <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }} dir="ltr">{notification.created_at}</p>
      </div>
      {!notification.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
    </div>
  );
};

export default memo(NotificationItem);
