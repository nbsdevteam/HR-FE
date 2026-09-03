import { useCallback, useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { useNotifications, useOdooMutation } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { Button, LoadingState, SearchInput, Select } from "@/shared/components";
import { auditCardCls } from "../styles";
import NotificationItem from "./NotificationItem";
import { selectStyle } from "@/styles/sharedClasses";
import { allCategoriesOptions, allTypesOptions } from "../data/auditMeta";

const NotificationsTab = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { notifications, unreadCount, loading } = useNotifications();

  const markReadMutation = useOdooMutation(odooData.markNotificationRead, "notifications");
  const markAllReadMutation = useOdooMutation(odooData.markAllNotificationsRead, "notifications");
  const dismissMutation = useOdooMutation(odooData.dismissNotification, "notifications");

  const filtered = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterCategory !== "all" && n.category !== filterCategory)
        return false;
      if (
        normalizedSearch &&
        !n.title.toLowerCase().includes(normalizedSearch) &&
        !(n.body || "").toLowerCase().includes(normalizedSearch)
      )
        return false;
      return true;
    });
  }, [notifications, filterType, filterCategory, searchQuery]);

  const markRead = useCallback(
    async (id: string) => {
      try {
        await markReadMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [markReadMutation.mutateAsync],
  );

  const markAllRead = useCallback(async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [markAllReadMutation.mutateAsync]);

  const dismiss = useCallback(
    async (id: string) => {
      try {
        await dismissMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to dismiss notification:", error);
      }
    },
    [dismissMutation.mutateAsync],
  );

  const handleFilterTypeChange = useCallback((value: string): void => {
    setFilterType(value);
  }, []);

  const handleFilterCategoryChange = useCallback((value: string): void => {
    setFilterCategory(value);
  }, []);

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
            <Button
              variant="unstyled"
              size="unstyled"
              rounded="rounded-lg"
              icon={Check}
              onClick={markAllRead}
              className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-sm"
            >
              {arabicSource("auditcenter.read_all")} {unreadCount}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState
          wrapperClassName="flex items-center justify-center py-16"
          iconClassName="w-8 h-8 text-primary animate-spin"
        />
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
