import { useState, useRef, useEffect } from "react";
import { Bell, MessageSquare, Settings, Search, User, CheckCircle, AlertTriangle, CalendarDays, X, Fingerprint, RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useDeviceStatus } from "../lib/hooks";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { arabicSource } from "../i18n/source";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const quote = quotes[Math.floor(Date.now() / 3600000) % quotes.length];
  const { deviceStatus, refresh: refreshDevice } = useDeviceStatus();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (deviceRef.current && !deviceRef.current.contains(e.target as Node)) setDeviceOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Device status colors
  const statusConfig = {
    online: { color: "text-emerald-400", bg: "bg-emerald-500", label: arabicSource("common.is_online"), ringColor: "ring-emerald-500/30" },
    stale: { color: "text-amber-400", bg: "bg-amber-500", label: arabicSource("common.late"), ringColor: "ring-amber-500/30" },
    offline: { color: "text-destructive", bg: "bg-destructive", label: arabicSource("common.is_offline"), ringColor: "ring-destructive/30" },
    no_device: { color: "text-muted-foreground", bg: "bg-muted-foreground", label: arabicSource("shared.no_device"), ringColor: "ring-muted-foreground/20" },
  };
  const ds = statusConfig[deviceStatus.status];

  // Format sync age
  function formatSyncAge(minutes: number): string {
    if (minutes < 1) return arabicSource("shared.now");
    if (minutes < 60) return `${arabicSource("common.ago")} ${minutes} ${arabicSource("common.min")}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${arabicSource("common.ago")} ${hours} ${arabicSource("common.hours")}`;
    return `${arabicSource("common.ago")} ${Math.floor(hours / 24)} ${arabicSource("common.days_2")}`;
  }

  // Manual sync trigger
  async function triggerSync() {
    setSyncing(true);
    try {
      // Try to reach the local sync service
      const res = await fetch("http://localhost:8089/api/sync", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
      }).catch(() => null);

      if (res?.ok) {
        // Sync triggered successfully — wait a moment then refresh status
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch {
      // Sync service not reachable — that's fine
    }
    // Always refresh device status from Supabase
    await refreshDevice();
    setSyncing(false);
  }

  return (
    <header className="h-[60px] bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 relative z-50">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div>
          <h3 className="text-foreground">{arabicSource("shared.hello_human_resources_manager")}</h3>
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>{quote}</p>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            type="text"
            placeholder={arabicSource("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none"
            style={{ width: 220 }}
          />
        </div>

        {/* ═══ Device Status Indicator ═══ */}
        {deviceStatus.status !== "no_device" && (
          <div className="relative" ref={deviceRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setDeviceOpen(!deviceOpen)}
              className={`relative p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer ring-2 ${ds.ringColor}`}
              title={`${arabicSource("common.fingerprint_device_2")} ${ds.label}`}
            >
              <Fingerprint className={`w-5 h-5 ${ds.color}`} />
              {/* Status dot */}
              <span className={`absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ${ds.bg} ring-2 ring-card`}>
                {deviceStatus.status === "online" && (
                  <span className={`absolute inset-0 rounded-full ${ds.bg} animate-ping opacity-40`} />
                )}
              </span>
            </motion.button>

            <AnimatePresence>
              {deviceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 end-0 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  {/* Header */}
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

                  {/* Device Details */}
                  <div className="p-3 space-y-2.5">
                    {deviceStatus.devices.map(dev => (
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

                    {/* Sync Stats */}
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

                  {/* Sync Button */}
                  <div className="p-2 border-t border-border/40">
                    <button
                      onClick={triggerSync}
                      disabled={syncing}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      style={{ fontSize: 13 }}
                    >
                      {syncing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {arabicSource("shared.synchronizing")}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          {arabicSource("shared.sync_now")}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <motion.button
            whileHover={{ scale: 1.1 }}
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
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 end-0 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="flex items-center justify-between p-3 border-b border-border/40">
                  <p className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("common.notices")}</p>
                  <button onClick={() => setBellOpen(false)} className="p-1 rounded hover:bg-muted/30 transition-colors cursor-pointer">
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
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-border/40">
                  <button className="w-full py-2 text-center text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" style={{ fontSize: 13 }}>
                    {arabicSource("shared.show_all_notifications")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        <ThemeSwitcher />

        <motion.button whileHover={{ scale: 1.1 }} className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
      </div>
    </header>
  );
}
