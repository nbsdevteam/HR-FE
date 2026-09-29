import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { empDisplayName, useDebouncedValue } from "@/shared/hooks";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { usePermissions } from "@/shared/auth/permissions";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { Employee } from "../types";
import { deviceMappingErrorMessage } from "../utils/deviceMappingErrorMessage";

const MAPPING_CANDIDATE_LIMIT = 20;

/** `hr_info_missing` API names → the labels the info tab uses for the same fields. */
const HR_FIELD_LABELS: Record<string, ArabicSourceKey> = {
  department: "common.section",
  position: "employees.job_position",
  joining_date: "common.direct_date",
};

/**
 * HR's two actions on a record device-sync created (backend lugal_hr ≥ 1.24.0):
 * confirm its HR information is complete, or — when the terminal person is
 * really an existing employee — move the device number and punches there.
 * The target is always HR's pick among active employees with no device
 * number; nothing is matched by name, and no number is ever typed or made up.
 */
export const useEmployeeDeviceOrigin = (
  employee: Employee,
  setEditData: Dispatch<SetStateAction<Employee>>,
  onMapped: () => void,
) => {
  const [mappingQuery, setMappingQuery] = useState("");
  const [mappingTargetId, setMappingTargetId] = useState("");
  /** Keeps the picked name on the trigger after a new search drops it from the results. */
  const [mappingTargetLabels, setMappingTargetLabels] = useState<Record<string, string>>({});
  const [originError, setOriginError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const debouncedQuery = useDebouncedValue(mappingQuery.trim(), 300);
  const markCompleteMutation = useOdooMutation(
    (id: string) => odooData.markHrInfoComplete(id),
    // The panel stays open — the table's own page cache has to drop its stale badge too.
    ["employees", "employeesPaged"],
  );
  const mappingMutation = useOdooMutation(
    (variables: { id: string; targetId: string }) =>
      odooData.mapDevicePersonToEmployee(variables.id, variables.targetId),
    ["employees", "employeesPaged", "employeeAvatars"],
  );

  const canEdit = hasPermission("hr.employees.edit") && !employee.readOnly;
  const canMap = canEdit && employee.source === "device" && Boolean(employee.deviceEmployeeNo);

  const candidatesQuery = useQuery({
    queryKey: ["employees", "deviceMappingCandidates", debouncedQuery],
    queryFn: () => odooData.fetchEmployeesPage({
      search: debouncedQuery,
      status: "active",
      hasDeviceNumber: false,
      limit: MAPPING_CANDIDATE_LIMIT,
    }),
    enabled: canMap,
    staleTime: STALE_TIME.SHORT,
    placeholderData: keepPreviousData,
  });

  const mappingCandidates = useMemo(() => candidatesQuery.data?.items ?? [], [candidatesQuery.data]);

  const missingFieldsLabel = useMemo(
    () => employee.hrInfoMissing
      .map(field => (HR_FIELD_LABELS[field] ? arabicSource(HR_FIELD_LABELS[field]) : field))
      .join(" · "),
    [employee.hrInfoMissing],
  );

  const handleMappingTargetChange = useCallback((id: string) => {
    setMappingTargetId(id);
    const picked = mappingCandidates.find(candidate => candidate.id === id);
    if (picked) setMappingTargetLabels({ [id]: empDisplayName(picked) });
  }, [mappingCandidates]);

  const handleMarkHrInfoComplete = useCallback(async () => {
    setOriginError(null);
    try {
      const saved = await markCompleteMutation.mutateAsync(employee.dbId);
      setEditData(prev => ({ ...prev, hrInfoPending: saved.hr_info_pending, hrInfoMissing: saved.hr_info_missing }));
    } catch {
      setOriginError(arabicSource("employees.hr_info_complete_error"));
    }
  }, [employee.dbId, markCompleteMutation.mutateAsync, setEditData]);

  const handleConfirmMapping = useCallback(async () => {
    if (!mappingTargetId) return;
    setOriginError(null);
    try {
      await mappingMutation.mutateAsync({ id: employee.dbId, targetId: mappingTargetId });
      onMapped();
    } catch (e: unknown) {
      setOriginError(deviceMappingErrorMessage(e));
    }
  }, [employee.dbId, mappingTargetId, mappingMutation.mutateAsync, onMapped]);

  return {
    canEdit,
    canMap,
    mappingCandidates,
    mappingCandidatesLoading: candidatesQuery.isFetching,
    mappingTargetId,
    mappingTargetLabels,
    handleMappingTargetChange,
    setMappingQuery,
    missingFieldsLabel,
    originError,
    markingComplete: markCompleteMutation.isPending,
    mapping: mappingMutation.isPending,
    handleMarkHrInfoComplete,
    handleConfirmMapping,
  };
};
