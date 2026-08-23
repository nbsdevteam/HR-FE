import { useMemo, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { useNotifications } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { SearchInput, Select } from "@/shared/components";
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

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setFilterType(e.target.value);
  };

  const handleFilterCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setFilterCategory(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className={auditCardCls}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={arabicSource("auditcenter.search_notifications")}
            wrapperClassName="flex items-center gap-2 flex-1 min-w-[200px]"
            iconClassName="w-4 h-4 text-muted-foreground"
            inputClassName="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          <Select
            value={filterType}
            onChange={handleFilterTypeChange}
            options={[
              { value: "all", label: arabicSource("common.all_types") },
              { value: "info", label: arabicSource("auditcenter.information") },
              { value: "warning", label: arabicSource("auditcenter.warning") },
              { value: "success", label: arabicSource("auditcenter.success") },
              { value: "error", label: arabicSource("common.error") },
              { value: "action", label: arabicSource("auditcenter.action_required") },
            ]}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          />
          <Select
            value={filterCategory}
            onChange={handleFilterCategoryChange}
            options={[
              { value: "all", label: arabicSource("common.all_categories") },
              { value: "system", label: arabicSource("common.system") },
              { value: "leave", label: arabicSource("common.vacations_2") },
              { value: "attendance", label: arabicSource("common.attendance_2") },
              { value: "payroll", label: arabicSource("common.salaries_2") },
              { value: "contract", label: arabicSource("common.contracts") },
              { value: "document", label: arabicSource("common.documentation") },
              { value: "approval", label: arabicSource("auditcenter.approvals") },
            ]}
            className="px-3 py-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
          />
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
