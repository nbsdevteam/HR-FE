import { useState, useCallback } from "react";
import { SYNC_API } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";
import type { Employee } from "../types";

export const useEmployeeTermination = (employee: Employee, onSave?: () => void) => {
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [terminationOptions, setTerminationOptions] = useState({ removeFace: true, removeFingerprint: true, removePerson: true });
  const [terminationLoading, setTerminationLoading] = useState(false);
  const [terminationResult, setTerminationResult] = useState<string | null>(null);

  const handleTermination = useCallback(async () => {
    setTerminationLoading(true);
    setTerminationResult(null);
    try {
      const res = await fetch(`${SYNC_API}/device/remove-credentials/${employee.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(terminationOptions),
      });
      const data = await res.json();
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
    setTimeout(() => {
      setShowTerminationDialog(false);
      setTerminationResult(null);
      onSave?.();
    }, 2500);
  }, [employee, terminationOptions, onSave]);

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
