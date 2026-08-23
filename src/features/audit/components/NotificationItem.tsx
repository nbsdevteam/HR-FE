import { motion } from "motion/react";
import { Bell, Check, X } from "lucide-react";
import type { DbNotification } from "@/shared/hooks";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import { notifTypeIcons } from "../data/auditMeta";
import { notifTypeColors } from "../styles";

type NotificationItemProps = {
  notification: DbNotification;
  index: number;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

const NotificationItem = ({
  notification,
  index,
  onMarkRead,
  onDismiss,
}: NotificationItemProps) => {
  const TypeIcon = notifTypeIcons[notification.type] || Bell;

  const handleMarkReadClick = (): void => {
    onMarkRead(notification.id);
  };

  const handleDismissClick = (): void => {
    onDismiss(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
        notification.is_read
          ? "bg-card/20 border-border/30"
          : notifTypeColors[notification.type] || "border-border/40 bg-card/30"
      }`}
    >
      <div
        className={`mt-0.5 ${
          notification.type === "warning"
            ? "text-amber-400"
            : notification.type === "error"
              ? "text-red-400"
              : notification.type === "success"
                ? "text-emerald-400"
                : "text-primary"
        }`}
      >
        <TypeIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm ${notification.is_read ? "text-foreground/70" : "text-foreground font-medium"}`}>
              {notification.title}
            </p>
            {notification.body && <p className="text-muted-foreground text-xs mt-1">{notification.body}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.is_read && (
              <button
                onClick={handleMarkReadClick}
                className="p-1.5 rounded text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                title={arabicSource("auditcenter.mark_as_read")}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleDismissClick}
              className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title={arabicSource("auditcenter.remove")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">{notification.category}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {formatDateTime(notification.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
