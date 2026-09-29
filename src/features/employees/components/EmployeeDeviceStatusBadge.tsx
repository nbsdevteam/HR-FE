import { AlertCircle, Fingerprint, UserMinus, type LucideIcon } from "lucide-react";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";

type EmployeeDeviceStatusBadgeProps = {
  isPending: boolean;
  isDeviceSynced: boolean;
  /** `device_enrollment_state` — a device number is never cleared, so only this says the person left the terminal. */
  enrollmentState: string;
};

type Badge = { tone: string; icon: LucideIcon; label: ArabicSourceKey };

const MISSING_DATA: Badge = { tone: "border-amber-500/30 bg-amber-500/10 text-amber-400", icon: AlertCircle, label: "employees.missing_data" };
const REMOVED: Badge = { tone: "border-red-500/30 bg-red-500/10 text-red-400", icon: UserMinus, label: "employees.device_enrollment_removed" };
const REGISTERED: Badge = { tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: Fingerprint, label: "employees.registered" };
const NOT_REGISTERED: Badge = { tone: "border-muted-foreground/20 bg-muted/10 text-muted-foreground", icon: Fingerprint, label: "employees.is_not_registered" };

const pickBadge = ({ isPending, isDeviceSynced, enrollmentState }: EmployeeDeviceStatusBadgeProps): Badge => {
  if (isPending) return MISSING_DATA;
  if (enrollmentState === "removed") return REMOVED;
  return isDeviceSynced ? REGISTERED : NOT_REGISTERED;
};

const EmployeeDeviceStatusBadge = (props: EmployeeDeviceStatusBadgeProps) => {
  const badge = pickBadge(props);
  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${badge.tone}`} style={{ fontSize: 11 }}>
      <Icon className="w-3 h-3" /> {arabicSource(badge.label)}
    </span>
  );
};

export default EmployeeDeviceStatusBadge;
