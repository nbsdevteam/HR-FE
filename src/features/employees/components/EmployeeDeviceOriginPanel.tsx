import type { Dispatch, SetStateAction } from "react";
import { AlertCircle, CheckCircle2, Fingerprint } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Button } from "@/shared/components";
import type { Employee } from "../types";
import { useEmployeeDeviceOrigin } from "../hooks/useEmployeeDeviceOrigin";
import EmployeeDeviceMappingForm from "./EmployeeDeviceMappingForm";

type EmployeeDeviceOriginPanelProps = {
  employee: Employee;
  setEditData: Dispatch<SetStateAction<Employee>>;
  /** The record was archived into the chosen employee — the caller closes and refetches. */
  onMapped: () => void;
};

/** For a record device-sync created from a terminal person: its HR information status and the mapping action. */
const EmployeeDeviceOriginPanel = ({ employee, setEditData, onMapped }: EmployeeDeviceOriginPanelProps) => {
  const {
    canEdit,
    canMap,
    mappingCandidates,
    mappingCandidatesLoading,
    mappingTargetId,
    mappingTargetLabels,
    handleMappingTargetChange,
    setMappingQuery,
    missingFieldsLabel,
    originError,
    markingComplete,
    mapping,
    handleMarkHrInfoComplete,
    handleConfirmMapping,
  } = useEmployeeDeviceOrigin(employee, setEditData, onMapped);

  if (employee.source !== "device" && !employee.hrInfoPending) return null;

  return (
    <div className="px-6 pb-4">
      <div className="p-4 rounded-lg border border-sky-500/30 bg-sky-500/5 space-y-3">
        <div className="flex items-start gap-2">
          <Fingerprint className="w-4 h-4 mt-0.5 text-sky-400 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-foreground text-sm">{arabicSource("employees.device_origin_title")}</p>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("employees.device_origin_hint")}</p>
          </div>
        </div>

        {employee.hrInfoPending ? (
          <div className="flex flex-wrap items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{arabicSource("employees.hr_info_pending_badge")}</span>
            {missingFieldsLabel && (
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                {arabicSource("employees.hr_info_missing_fields")}: {missingFieldsLabel}
              </span>
            )}
            {canEdit && (
              <Button variant="outline" icon={CheckCircle2} onClick={handleMarkHrInfoComplete} loading={markingComplete} className="h-8 px-3 text-xs ms-auto">
                {arabicSource("employees.hr_info_complete_action")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{arabicSource("employees.hr_info_complete_done")}</span>
          </div>
        )}

        {canMap && (
          <EmployeeDeviceMappingForm
            candidates={mappingCandidates}
            candidatesLoading={mappingCandidatesLoading}
            targetId={mappingTargetId}
            targetLabels={mappingTargetLabels}
            mapping={mapping}
            onTargetChange={handleMappingTargetChange}
            onQueryChange={setMappingQuery}
            onConfirm={handleConfirmMapping}
          />
        )}

        {originError && (
          <p className="text-destructive" style={{ fontSize: 12 }}>{originError}</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeDeviceOriginPanel;
