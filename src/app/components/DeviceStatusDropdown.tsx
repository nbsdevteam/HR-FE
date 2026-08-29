import type { RefObject } from "react";
import { motion } from "motion/react";
import { Fingerprint, RefreshCw, Loader2 } from "lucide-react";
import type { DeviceStatus } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import DropdownPanel from "./DropdownPanel";

type DeviceStatusDropdownProps = {
  deviceStatus: DeviceStatus;
  isOpen: boolean;
  dropdownRef: RefObject<HTMLDivElement>;
  onToggle: () => void;
  syncing: boolean;
  onSync: () => void;
};

const statusConfig = {
  online: { color: "text-emerald-400", bg: "bg-emerald-500", label: arabicSource("common.is_online"), ringColor: "ring-emerald-500/30" },
  stale: { color: "text-amber-400", bg: "bg-amber-500", label: arabicSource("common.late"), ringColor: "ring-amber-500/30" },
  offline: { color: "text-destructive", bg: "bg-destructive", label: arabicSource("common.is_offline"), ringColor: "ring-destructive/30" },
  no_device: { color: "text-muted-foreground", bg: "bg-muted-foreground", label: arabicSource("shared.no_device"), ringColor: "ring-muted-foreground/20" },
};

const formatSyncAge = (minutes: number): string => {
  if (minutes < 1) return arabicSource("shared.now");
  if (minutes < 60) return `${arabicSource("common.ago")} ${minutes} ${arabicSource("common.min")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${arabicSource("common.ago")} ${hours} ${arabicSource("common.hours")}`;
  return `${arabicSource("common.ago")} ${Math.floor(hours / 24)} ${arabicSource("common.days_2")}`;
};

const DeviceStatusDropdown = ({
  deviceStatus,
  isOpen,
  dropdownRef,
  onToggle,
  syncing,
  onSync,
}: DeviceStatusDropdownProps) => {
  const ds = statusConfig[deviceStatus.status];

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={onToggle}
        className={`relative p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer ring-2 ${ds.ringColor}`}
        title={`${arabicSource("common.fingerprint_device_2")} ${ds.label}`}
      >
        <Fingerprint className={`w-5 h-5 ${ds.color}`} />
        <span className={`absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ${ds.bg} ring-2 ring-card`} />
      </motion.button>

      <DropdownPanel isOpen={isOpen} widthClassName="w-72">
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
            onClick={onSync}
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
      </DropdownPanel>
    </div>
  );
};

export default DeviceStatusDropdown;
