import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DeviceSyncStatus } from "../types";

type EmployeeDeviceSyncBannerProps = {
  status: DeviceSyncStatus;
};

const EmployeeDeviceSyncBanner = ({ status }: EmployeeDeviceSyncBannerProps) => {
  if (status === "idle") return null;

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        status === "syncing"
          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
          : status === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
      }`}
    >
      {status === "syncing" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">
            {arabicSource(
              "employees.synchronizing_data_with_the_fingerprint_device",
            )}
          </span>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">
            {arabicSource(
              "employees.the_employee_was_successfully_created_and_registered_on_the_fing",
            )}
          </span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            {arabicSource(
              "employees.saved_to_the_system_but_synchronization_with_the_device_failed_w",
            )}
          </span>
        </>
      )}
    </div>
  );
};

export default EmployeeDeviceSyncBanner;
