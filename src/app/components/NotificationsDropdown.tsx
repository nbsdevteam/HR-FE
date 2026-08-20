import type { RefObject } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X } from "lucide-react";
import type { DbNotification } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import NotificationItem from "./NotificationItem";

type Notification = DbNotification;

type NotificationsDropdownProps = {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  dropdownRef: RefObject<HTMLDivElement>;
  onToggle: () => void;
  onClose: () => void;
  onMarkAllRead: () => void;
  onSelectNotification: (notification: Notification) => void;
};

const NotificationsDropdown = ({
  notifications,
  unreadCount,
  isOpen,
  dropdownRef,
  onToggle,
  onClose,
  onMarkAllRead,
  onSelectNotification,
}: NotificationsDropdownProps) => (
  <div className="relative" ref={dropdownRef}>
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={onToggle}
      className="relative p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
    >
      <Bell className="w-5 h-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -end-1 bg-destructive h-4 min-w-4 px-1 rounded-full flex items-center justify-center" style={{ fontSize: 9 }}>
          <span className="text-destructive-foreground">{unreadCount > 99 ? "99+" : unreadCount}</span>
        </span>
      )}
    </motion.button>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          className="absolute top-full mt-2 end-0 w-80 max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
        >
          <div className="flex items-center justify-between p-3 border-b border-border/40">
            <p className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("common.notices")}</p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="px-2 py-0.5 rounded text-xs text-primary hover:bg-primary/10 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button onClick={onClose} className="p-1 rounded hover:bg-muted/30 cursor-pointer">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">{arabicSource("common.no_results_found")}</p>
            ) : notifications.slice(0, 30).map((n) => (
              <NotificationItem key={n.id} notification={n} onSelect={onSelectNotification} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default NotificationsDropdown;
