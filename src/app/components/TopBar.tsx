import { useState, useRef, useCallback, useEffect } from "react";
import { MessageSquare, Settings, Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeSwitcher } from "@/app/providers";
import { useDeviceStatus, useNotifications } from "@/shared/hooks";
import { LanguageSwitcher } from "@/app/providers";
import { arabicSource } from "@/i18n/source";
import { useNavShell } from "./NavShellContext";
import { useAuth } from "@/shared/auth";
import { SYNC_API } from "@/shared/constants";
import * as odooData from "@/shared/api/odooData";
import DeviceStatusDropdown from "./DeviceStatusDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import UserMenuDropdown from "./UserMenuDropdown";

const quotes = [
  arabicSource("shared.success_is_the_result_of_preparation_hard_work_and_learning_from"),
  arabicSource("shared.investing_in_employees_is_the_best_investment_for_an_organizatio"),
  arabicSource("shared.leadership_is_the_art_of_making_others_achieve_their_goals_by_th"),
  arabicSource("shared.building_a_strong_team_starts_from_a_healthy_corporate_culture"),
  arabicSource("shared.continuous_development_is_the_key_to_institutional_excellence"),
];

const TopBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { toggleMobileNav, isDesktop } = useNavShell();
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications();
  const { deviceStatus, refresh: refreshDevice } = useDeviceStatus();

  const bellRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const quote = quotes[Math.floor(Date.now() / 3600000) % quotes.length];
  const displayName = user?.name || user?.email || arabicSource("shared.hello_human_resources_manager");

  const handleBellToggle = useCallback(() => setBellOpen((o) => !o), []);
  const handleBellClose = useCallback(() => setBellOpen(false), []);
  const handleDeviceToggle = useCallback(() => setDeviceOpen((o) => !o), []);
  const handleUserToggle = useCallback(() => setUserOpen((v) => !v), []);
  const handleSearchOpenToggle = useCallback(() => setSearchOpen((v) => !v), []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await odooData.markAllNotificationsRead();
      await refetchNotifications();
    } catch { /* ignore */ }
  }, [refetchNotifications]);

  const handleSelectNotification = useCallback(async (n: { id: string; is_read: boolean }) => {
    if (!n.is_read) {
      try {
        await odooData.markNotificationRead(n.id);
        await refetchNotifications();
      } catch { /* ignore */ }
    }
  }, [refetchNotifications]);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${SYNC_API}/sync`, {
        method: "POST",
        signal: AbortSignal.timeout(120000),
      }).catch(() => null);
      if (res?.ok) await new Promise((r) => setTimeout(r, 3000));
    } catch {
      /* sync service optional */
    }
    await refreshDevice();
    setSyncing(false);
  }, [refreshDevice]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setUserOpen(false);
    }
  }, [signOut]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (deviceRef.current && !deviceRef.current.contains(e.target as Node)) setDeviceOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="min-h-[56px] h-auto md:h-[60px] bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 relative z-50 py-2 md:py-0">
      {/* Left: menu + greeting */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {!isDesktop && (
          <button
            type="button"
            onClick={toggleMobileNav}
            className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="min-w-0">
          <h3 className="text-foreground truncate" style={{ fontSize: 14 }}>
            <span className="md:hidden">{displayName}</span>
            <span className="hidden md:inline">{arabicSource("shared.hello_human_resources_manager")}</span>
          </h3>
          <p className="text-muted-foreground hidden lg:block truncate" style={{ fontSize: 12 }}>
            {quote}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
        <LanguageSwitcher />

        {/* Search: icon on mobile, full field on md+ */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            type="text"
            placeholder={arabicSource("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none w-[160px] lg:w-[220px]"
          />
        </div>
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-secondary cursor-pointer"
          onClick={handleSearchOpenToggle}
          aria-label={arabicSource("common.search")}
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>

        {deviceStatus.status !== "no_device" && (
          <DeviceStatusDropdown
            deviceStatus={deviceStatus}
            isOpen={deviceOpen}
            dropdownRef={deviceRef}
            onToggle={handleDeviceToggle}
            syncing={syncing}
            onSync={triggerSync}
          />
        )}

        <NotificationsDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={bellOpen}
          dropdownRef={bellRef}
          onToggle={handleBellToggle}
          onClose={handleBellClose}
          onMarkAllRead={handleMarkAllRead}
          onSelectNotification={handleSelectNotification}
        />

        <motion.button whileHover={{ scale: 1.05 }} className="hidden sm:inline-flex p-2 rounded-lg hover:bg-secondary cursor-pointer">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        <div className="hidden sm:block">
          <ThemeSwitcher />
        </div>

        <motion.button whileHover={{ scale: 1.05 }} className="hidden md:inline-flex p-2 rounded-lg hover:bg-secondary cursor-pointer">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        {/* User menu + logout */}
        <UserMenuDropdown
          displayName={displayName}
          email={user?.email}
          isOpen={userOpen}
          dropdownRef={userRef}
          onToggle={handleUserToggle}
          signingOut={signingOut}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile search expand */}
      <AnimatePresence>
        {searchOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full inset-x-0 border-b border-border bg-card/95 backdrop-blur-md p-3 z-[90] md:hidden"
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder={arabicSource("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TopBar;
