import { useMemo, useState } from "react";
import { Bell, Check, Loader2, Search } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { useNotifications } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { auditCardCls } from "../styles";
import NotificationItem from "./NotificationItem";

const NotificationsTab = () => {
  const { notifications, unreadCount, loading, refetch } = useNotifications();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterCategory !== "all" && n.category !== filterCategory) return false;
      if (searchQuery && !n.title.includes(searchQuery) && !(n.body || "").includes(searchQuery)) return false;
      return true;
    });
  }, [notifications, filterType, filterCategory, searchQuery]);

  const markRead = async (id: string) => {
    await odooData.markNotificationRead(id);
    refetch();
  };

  const markAllRead = async () => {
    await odooData.markAllNotificationsRead();
    refetch();
  };

  const dismiss = async (id: string) => {
    await odooData.dismissNotification(id);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className={auditCardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder={arabicSource("auditcenter.search_notifications")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm">
            <option value="all">{arabicSource("common.all_types")}</option>
            <option value="info">{arabicSource("auditcenter.information")}</option>
            <option value="warning">{arabicSource("auditcenter.warning")}</option>
            <option value="success">{arabicSource("auditcenter.success")}</option>
            <option value="error">{arabicSource("common.error")}</option>
            <option value="action">{arabicSource("auditcenter.action_required")}</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm">
            <option value="all">{arabicSource("common.all_categories")}</option>
            <option value="system">{arabicSource("common.system")}</option>
            <option value="leave">{arabicSource("common.vacations_2")}</option>
            <option value="attendance">{arabicSource("common.attendance_2")}</option>
            <option value="payroll">{arabicSource("common.salaries_2")}</option>
            <option value="contract">{arabicSource("common.contracts")}</option>
            <option value="document">{arabicSource("common.documentation")}</option>
            <option value="approval">{arabicSource("auditcenter.approvals")}</option>
          </select>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer text-sm">
              <Check className="w-4 h-4" />
              {arabicSource("auditcenter.read_all")}{unreadCount})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className={`${auditCardCls} text-center py-12`}>
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{arabicSource("common.no_notifications")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification, index) => (
            <NotificationItem key={notification.id} notification={notification} index={index} onMarkRead={markRead} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
