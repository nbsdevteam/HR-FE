import { AlertCircle, Fingerprint } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { EmployeeSource } from "../types";

type EmployeeOriginBadgesProps = {
  source: EmployeeSource;
  hrInfoPending: boolean;
  /** Kanban tile size. */
  compact?: boolean;
  className?: string;
};

const BADGE_CLASS = "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border";

/** "From device" for a record device-sync created, "HR info pending" until HR completes it. */
const EmployeeOriginBadges = ({ source, hrInfoPending, compact = false, className = "" }: EmployeeOriginBadgesProps) => {
  if (source !== "device" && !hrInfoPending) return null;
  const fontSize = compact ? 8 : 11;
  const iconClass = compact ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <span className={`flex flex-wrap items-center gap-1 ${className}`}>
      {source === "device" && (
        <span className={`${BADGE_CLASS} border-sky-500/30 bg-sky-500/10 text-sky-400`} style={{ fontSize }}>
          <Fingerprint className={iconClass} />
          {arabicSource("employees.device_origin_badge")}
        </span>
      )}
      {hrInfoPending && (
        <span className={`${BADGE_CLASS} border-amber-500/30 bg-amber-500/10 text-amber-400`} style={{ fontSize }}>
          <AlertCircle className={iconClass} />
          {arabicSource("employees.hr_info_pending_badge")}
        </span>
      )}
    </span>
  );
};

export default EmployeeOriginBadges;
