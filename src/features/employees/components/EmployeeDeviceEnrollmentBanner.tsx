import { AlertCircle, CheckCircle2, Clock, Loader2, UserMinus, XCircle, type LucideIcon } from "lucide-react";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import { Button } from "@/shared/components";
import type { DeviceEnrollment } from "../types";
import { deviceSyncErrorMessage } from "../utils/deviceSyncErrorMessage";

type EmployeeDeviceEnrollmentBannerProps = {
  enrollment: DeviceEnrollment | null;
  /** A `runEnrollment`/`runRemoval` pass is in flight — takes priority over `enrollment.state`. */
  syncing?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
};

const BLUE = "border-blue-500/30 bg-blue-500/10 text-blue-400";
const RED = "border-red-500/30 bg-red-500/10 text-red-400";

type BannerState = { tone: string; icon: LucideIcon; message: ArabicSourceKey; spin?: boolean };

/** The doc's state→message table (§5), plus the removal states (§7) and a device-side removal. */
const BANNER_STATES: Record<string, BannerState> = {
  syncing: { tone: BLUE, icon: Loader2, message: "employees.device_enrollment_syncing", spin: true },
  enrolled: { tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", icon: CheckCircle2, message: "employees.device_enrollment_enrolled" },
  partial: { tone: "border-amber-500/30 bg-amber-500/10 text-amber-400", icon: AlertCircle, message: "employees.device_enrollment_partial" },
  failed: { tone: RED, icon: XCircle, message: "employees.device_enrollment_failed" },
  pending: { tone: BLUE, icon: Clock, message: "employees.device_enrollment_pending" },
  removal_pending: { tone: BLUE, icon: Clock, message: "employees.device_enrollment_removal_pending" },
  removal_failed: { tone: RED, icon: XCircle, message: "employees.device_enrollment_removal_failed" },
  removed: { tone: "border-muted-foreground/20 bg-muted/10 text-muted-foreground", icon: UserMinus, message: "employees.device_enrollment_removed" },
};

/** `removed_at` arrives as `+03:00` ISO — already Baghdad wall-clock, so no conversion. */
const baghdadStamp = (iso: string): string => iso.slice(0, 16).replace("T", " ");

const EmployeeDeviceEnrollmentBanner = ({
  enrollment,
  syncing = false,
  onRetry,
  retrying = false,
}: EmployeeDeviceEnrollmentBannerProps) => {
  if (!syncing && !enrollment) return null;

  const state = syncing ? "syncing" : (enrollment?.state ?? "pending");
  // `untracked` is a person enrolled before tracking existed — nothing to report.
  if (state === "untracked") return null;
  const banner = BANNER_STATES[state] ?? BANNER_STATES.pending;
  const Icon = banner.icon;
  const removedOnDevice = state === "removed" && enrollment?.removed_by === "device";
  const showRetry = !syncing && onRetry && (enrollment?.retry_required || state === "partial" || state === "failed");

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${banner.tone}`}>
      <Icon className={`w-4 h-4 flex-shrink-0${banner.spin ? " animate-spin" : ""}`} />
      <span className="text-sm flex-1">
        {arabicSource(removedOnDevice ? "employees.device_enrollment_removed_on_device" : banner.message)}
        {state === "removed" && enrollment?.removed_at && (
          <span dir="ltr"> · {baghdadStamp(enrollment.removed_at)}</span>
        )}
        {enrollment?.last_error && ` — ${deviceSyncErrorMessage(enrollment.last_error)}`}
      </span>
      {showRetry && (
        <Button variant="outline" onClick={onRetry} loading={retrying} className="h-8 px-3 text-xs">
          {arabicSource("employees.retry")}
        </Button>
      )}
    </div>
  );
};

export default EmployeeDeviceEnrollmentBanner;
