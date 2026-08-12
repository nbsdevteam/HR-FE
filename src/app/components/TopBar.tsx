import { useState, useRef, useEffect } from "react";
import {
  Bell, MessageSquare, Settings, Search, User, CheckCircle, AlertTriangle,
  CalendarDays, X, Fingerprint, RefreshCw, Loader2, Menu, LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useDeviceStatus } from "../lib/hooks";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { arabicSource } from "../i18n/source";
import { useNavShell } from "./NavShellContext";
import { useAuth } from "../lib/auth";
import { SYNC_API } from "../lib/constants";

const quotes = [
  arabicSource("shared.success_is_the_result_of_preparation_hard_work_and_learning_from"),
  arabicSource("shared.investing_in_employees_is_the_best_investment_for_an_organizatio"),
  arabicSource("shared.leadership_is_the_art_of_making_others_achieve_their_goals_by_th"),
  arabicSource("shared.building_a_strong_team_starts_from_a_healthy_corporate_culture"),
  arabicSource("shared.continuous_development_is_the_key_to_institutional_excellence"),
];

const notifications = [
  { id: 1, text: arabicSource("shared.ahmed_mohamed_s_leave_request_has_been_accepted"), time: arabicSource("shared.30_minutes_ago"), icon: CalendarDays, color: "text-emerald-400", read: false },
  { id: 2, text: arabicSource("shared.a_warning_was_issued_to_sarah_khaled"), time: arabicSource("shared.an_hour_ago"), icon: AlertTriangle, color: "text-destructive", read: false },
  { id: 3, text: arabicSource("shared.marketing_team_performance_evaluation_completed"), time: arabicSource("shared.2_hours_ago"), icon: CheckCircle, color: "text-primary", read: false },
];

export function TopBar() {
  const { toggleMobileNav, isDesktop } = useNavShell();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const quote = quotes[Math.floor(Date.now() / 3600000) % quotes.length];
  const { deviceStatus, refresh: refreshDevice } = useDeviceStatus();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (deviceRef.current && !deviceRef.current.contains(e.target as Node)) setDeviceOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const statusConfig = {
    online: { color: "text-emerald-400", bg: "bg-emerald-500", label: arabicSource("common.is_online"), ringColor: "ring-emerald-500/30" },
    stale: { color: "text-amber-400", bg: "bg-amber-500", label: arabicSource("common.late"), ringColor: "ring-amber-500/30" },
    offline: { color: "text-destructive", bg: "bg-destructive", label: arabicSource("common.is_offline"), ringColor: "ring-destructive/30" },
    no_device: { color: "text-muted-foreground", bg: "bg-muted-foreground", label: arabicSource("shared.no_device"), ringColor: "ring-muted-foreground/20" },
  };
  const ds = statusConfig[deviceStatus.status];

  function formatSyncAge(minutes: number): string {
    if (minutes < 1) return arabicSource("shared.now");
    if (minutes < 60) return `${arabicSource("common.ago")} ${minutes} ${arabicSource("common.min")}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${arabicSource("common.ago")} ${hours} ${arabicSource("common.hours")}`;
    return `${arabicSource("common.ago")} ${Math.floor(hours / 24)} ${arabicSource("common.days_2")}`;
  }

  async function triggerSync() {
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
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setUserOpen(false);
    }
  }

  const displayName = user?.name || user?.email || arabicSource("shared.hello_human_resources_manager");

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
          onClick={() => setSearchOpen((v) => !v)}
          aria-label={arabicSource("common.search")}
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>

        {deviceStatus.status !== "no_device" && (
          <div className="relative hidden sm:block" ref={deviceRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setDeviceOpen(!deviceOpen)}
              className={`relative p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer ring-2 ${ds.ringColor}`}
              title={`${arabicSource("common.fingerprint_device_2")} ${ds.label}`}
            >
              <Fingerprint className={`w-5 h-5 ${ds.color}`} />
              <span className={`absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ${ds.bg} ring-2 ring-card`} />
            </motion.button>

            <AnimatePresence>
              {deviceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute top-full mt-2 end-0 w-72 max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  <div className="flex items-center justify-between p-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <Fingerprint className={`w-4 h-4 ${ds.color}`} />
                      <p className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("common.fingerprint_device")}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      deviceStatus.status === "online" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      deviceStatus.status === "stale" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}>
                      {ds.label}
                    </span>
                  </div>
                  <div className="p-3 space-y-2.5">
                    {deviceStatus.devices.map((dev) => (
                      <div key={dev.id} className="bg-muted/10 rounded-lg p-2.5 border border-border/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-foreground" style={{ fontSize: 12 }}>{dev.name}</span>
                          <span className="text-muted-foreground" style={{ fontSize: 10 }}>{dev.model}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground" style={{ fontSize: 10 }}>
                          <span dir="ltr">{dev.ip_address}:{dev.port}</span>
                          {dev.location && <span>{dev.location}</span>}
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/10 rounded-lg p-2 text-center border border-border/20">
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>{arabicSource("shared.last_sync")}</p>
                        <p className={`font-medium mt-0.5 ${ds.color}`} style={{ fontSize: 12 }}>
                          {deviceStatus.lastSyncAt ? formatSyncAge(deviceStatus.syncAgeMinutes) : arabicSource("shared.not_completed")}
                        </p>
                      </div>
                      <div className="bg-muted/10 rounded-lg p-2 text-center border border-border/20">
                        <p className="text-muted-foreground" style={{ fontSize: 10 }}>{arabicSource("shared.today_s_records")}</p>
                        <p className="text-foreground font-medium mt-0.5" style={{ fontSize: 12 }}>
                          {deviceStatus.todayDeviceEvents} {arabicSource("common.record")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border/40">
                    <button
                      onClick={triggerSync}
                      disabled={syncing}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      style={{ fontSize: 13 }}
                    >
                      {syncing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />{arabicSource("shared.synchronizing")}</>
                      ) : (
                        <><RefreshCw className="w-4 h-4" />{arabicSource("shared.sync_now")}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="relative" ref={bellRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute -top-1 -end-1 bg-destructive h-4 w-4 rounded-full flex items-center justify-center" style={{ fontSize: 9 }}>
              <span className="text-destructive-foreground">3</span>
            </span>
          </motion.button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute top-full mt-2 end-0 w-80 max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="flex items-center justify-between p-3 border-b border-border/40">
                  <p className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("common.notices")}</p>
                  <button onClick={() => setBellOpen(false)} className="p-1 rounded hover:bg-muted/30 cursor-pointer">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/10 last:border-b-0 cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
                          <Icon className={`w-4 h-4 ${n.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground" style={{ fontSize: 13 }}>{n.text}</p>
                          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 11 }}>{n.time}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
            aria-label="User menu"
          >
            <User className="w-4 h-4 text-primary" />
          </button>
          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute top-full mt-2 end-0 w-56 max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="p-3 border-b border-border/40">
                  <p className="text-foreground truncate" style={{ fontSize: 13 }}>{displayName}</p>
                  {user?.email && (
                    <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{user.email}</p>
                  )}
                </div>
                <div className="p-1.5 sm:hidden">
                  <ThemeSwitcher />
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                  style={{ fontSize: 13 }}
                >
                  {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  {arabicSource("common.log_out")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
}
