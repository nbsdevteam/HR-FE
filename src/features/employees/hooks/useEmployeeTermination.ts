import { useState, useCallback } from "react";
import { removeCredentialsFromDevice } from "@/shared/api/deviceSync";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";

export const useEmployeeTermination = (employee: Employee, onSave?: () => void) => {
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [terminationOptions, setTerminationOptions] = useState({ removeFace: true, removeFingerprint: true, removePerson: true });
  const [terminationLoading, setTerminationLoading] = useState(false);
  const [terminationResult, setTerminationResult] = useState<string | null>(null);

  const closeAfterResult = useCallback(() => {
    setTimeout(() => {
      setShowTerminationDialog(false);
      setTerminationResult(null);
      onSave?.();
    }, 2500);
  }, [onSave]);

  const handleTermination = useCallback(async () => {
    setTerminationLoading(true);
    setTerminationResult(null);
    // Never `employee.id` (person_id): they diverge post-B.5, and removing
    // credentials under that number targets whoever holds that terminal slot
    // instead — for a terminal-first hire that is person #0 (hand-off §3.4).
    const deviceNo = employee.deviceEmployeeNo;
    if (!deviceNo) {
      setTerminationResult(arabicSource("shared.employee_has_no_device_number_nothing_to_remove"));
      setTerminationLoading(false);
      closeAfterResult();
      return;
    }
    try {
      const data = await removeCredentialsFromDevice(deviceNo, terminationOptions);
      if (data.success) {
        const parts: string[] = [];
        if (data.results?.face === "removed") parts.push(arabicSource("common.face_image"));
        if (data.results?.fingerprint === "removed") parts.push(arabicSource("common.footprint"));
        if (data.results?.person === "removed") parts.push(arabicSource("shared.calculation_from_the_device"));
        setTerminationResult(parts.length > 0 ? `${arabicSource("shared.removed")} ${parts.join("، ")}` : arabicSource("shared.the_operation_was_completed"));
      } else {
        setTerminationResult(arabicSource("shared.removal_from_the_device_failed"));
      }
    } catch {
      setTerminationResult(arabicSource("shared.unable_to_connect_to_device_you_can_remove_later_from_the_finger"));
    }
    setTerminationLoading(false);
    // Close dialog after showing result
    closeAfterResult();
  }, [closeAfterResult, employee, terminationOptions]);

  const handleCloseTerminationDialog = useCallback(() => {
    setShowTerminationDialog(false);
    setTerminationResult(null);
  }, []);

  return {
    handleCloseTerminationDialog,
    handleTermination,
    setShowTerminationDialog,
    setTerminationOptions,
    showTerminationDialog,
    terminationLoading,
    terminationOptions,
    terminationResult,
  };
};
