import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { DeviceConnectionStatus } from "../types";

const STATUS_STYLES: Record<
  DeviceConnectionStatus,
  { badge: string; dot: string; labelKey: ArabicSourceKey }
> = {
  online: {
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
    labelKey: "common.is_online",
  },
  offline: {
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    dot: "bg-red-400",
    labelKey: "common.is_offline",
  },
  unknown: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400",
    labelKey: "devicemanagement.status_unknown",
  },
};

const DeviceStatusBadge = ({ status }: { status: DeviceConnectionStatus }) => {
  const { badge, dot, labelKey } = STATUS_STYLES[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {arabicSource(labelKey)}
    </span>
  );
};

export default DeviceStatusBadge;
