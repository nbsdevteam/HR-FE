import { useMemo, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { useNotifications } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { SearchInput, Select } from "@/shared/components";
import { auditCardCls } from "../styles";
import NotificationItem from "./NotificationItem";
import { selectStyle } from "@/styles/sharedClasses";
import { allCategoriesOptions, allTypesOptions } from "../data/auditMeta";

const NotificationsTab = () => {
  const { notifications, unreadCount, loading, refetch } = useNotifications();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterCategory !== "all" && n.category !== filterCategory)
        return false;
      if (
        searchQuery &&
        !n.title.includes(searchQuery) &&
        !(n.body || "").includes(searchQuery)
      )
        return false;
      return true;
    });
  }, [notifications, filterType, filterCategory, searchQuery]);

  const markRead = async (id: string) => {
    try {
      await odooData.markNotificationRead(id);
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await odooData.markAllNotificationsRead();
      refetch();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const dismiss = async (id: string) => {
    try {
      await odooData.dismissNotification(id);
      refetch();
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const handleFilterTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    setFilterType(e.target.value);
  };

  const handleFilterCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
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
            options={allTypesOptions}
            className={selectStyle}
          />
          <Select
            value={filterCategory}
            onChange={handleFilterCategoryChange}
            options={allCategoriesOptions}
            className={selectStyle}
          />
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer text-sm"
            >
              <Check className="w-4 h-4" />
              {arabicSource("auditcenter.read_all")}
              {unreadCount})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${auditCardCls} text-center py-12`}>
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {arabicSource("common.no_notifications")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              index={index}
              onMarkRead={markRead}
              onDismiss={dismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
