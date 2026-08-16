import { arabicSource } from "@/i18n/source";

export const DeviceStatusBadge = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
    active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : "bg-red-500/10 text-red-400 border border-red-500/20"
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-red-400"}`} />
    {active ? arabicSource("common.is_online") : arabicSource("common.is_offline")}
  </span>
);
