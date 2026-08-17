import { motion } from "motion/react";
import { Bell } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "../styles";
import { NOTIFICATION_ITEMS } from "../constants/settings";
import { useNotificationToggles } from "../hooks/useNotificationToggles";
import { NotificationToggleRow } from "./NotificationToggleRow";

export const NotificationsCard = () => {
  const { notifToggles, toggleNotif } = useNotificationToggles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cardCls}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-foreground">{arabicSource("common.notices")}</h3>
      </div>
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <NotificationToggleRow
            key={item.key}
            label={item.label}
            on={notifToggles[item.key]}
            onToggle={() => toggleNotif(item.key)}
          />
        ))}
      </div>
    </motion.div>
  );
};
