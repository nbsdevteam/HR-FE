import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button } from "@/shared/components";
import type { DeviceEnrollment } from "../types";

type EmployeeDeviceEnrollmentBannerProps = {
  enrollment: DeviceEnrollment | null;
  /** A `runEnrollment`/`runRemoval` pass is in flight — takes priority over `enrollment.state`. */
  syncing?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
};

const TONE_CLASS: Record<string, string> = {
  enrolled: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  partial: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  removal_pending: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  pending: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

/** The doc's state→message table (§5): enrolled/partial/failed/pending, plus removal_pending (§7). */
const EmployeeDeviceEnrollmentBanner = ({
  enrollment,
  syncing = false,
  onRetry,
  retrying = false,
}: EmployeeDeviceEnrollmentBannerProps) => {
  if (!syncing && !enrollment) return null;

  const state = syncing ? "syncing" : (enrollment?.state ?? "pending");
  const showRetry = !syncing && onRetry && (enrollment?.retry_required || state === "partial" || state === "failed");

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${state === "syncing" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : (TONE_CLASS[state] || TONE_CLASS.pending)}`}>
      {state === "syncing" && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
      {state === "enrolled" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
      {state === "partial" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {state === "failed" && <XCircle className="w-4 h-4 flex-shrink-0" />}
      {(state === "pending" || state === "removal_pending") && <Clock className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm flex-1">
        {state === "syncing" && arabicSource("employees.device_enrollment_syncing")}
        {state === "enrolled" && arabicSource("employees.device_enrollment_enrolled")}
        {state === "partial" && arabicSource("employees.device_enrollment_partial")}
        {state === "failed" && arabicSource("employees.device_enrollment_failed")}
        {state === "removal_pending" && arabicSource("employees.device_enrollment_removal_pending")}
        {state === "pending" && arabicSource("employees.device_enrollment_pending")}
        {enrollment?.last_error && ` — ${enrollment.last_error}`}
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
