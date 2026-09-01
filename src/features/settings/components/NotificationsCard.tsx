import { Bell } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { NOTIFICATION_ITEMS } from "../constants/settings";
import { useNotificationToggles } from "../hooks/useNotificationToggles";
import NotificationToggleRow from "./NotificationToggleRow";
import SettingsSectionCard from "./SettingsSectionCard";
import type { NotifKey } from "../types";

const NotificationsCard = () => {
  const { notifToggles, toggleNotif } = useNotificationToggles();

  const handleToggleNotification = (key: NotifKey) => (): void => {
    toggleNotif(key);
  };

  return (
    <SettingsSectionCard
      icon={Bell}
      title={arabicSource("common.notices")}
      delay={0.2}
    >
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <NotificationToggleRow
            key={item.key}
            label={item.label}
            on={notifToggles[item.key]}
            onToggle={handleToggleNotification(item.key)}
          />
        ))}
      </div>
    </SettingsSectionCard>
  );
};

export default NotificationsCard;
