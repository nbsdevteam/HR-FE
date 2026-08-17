import { useCallback, useState } from "react";
import { INITIAL_NOTIF_TOGGLES } from "../constants/settings";
import type { NotifKey, NotifToggles } from "../types";

export const useNotificationToggles = () => {
  const [notifToggles, setNotifToggles] = useState<NotifToggles>({ ...INITIAL_NOTIF_TOGGLES });

  const toggleNotif = useCallback((key: NotifKey) => {
    setNotifToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { notifToggles, toggleNotif };
};
