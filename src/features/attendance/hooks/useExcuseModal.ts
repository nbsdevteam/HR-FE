import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { AttendanceRow, ExcuseForm } from "@/features/attendance/types";

const EMPTY_EXCUSE_FORM: ExcuseForm = {
  late: false,
  absence: false,
  shortfall: false,
  note: "",
};

type UseExcuseModalArgs = {
  /** Called after the excuse is persisted so the caller can patch/refresh its records. */
  onSaved: (recordId: string, form: ExcuseForm) => Promise<void> | void;
};

/** Owns the excuse dialog: which row is open, the draft form and the save call. */
export const useExcuseModal = ({ onSaved }: UseExcuseModalArgs) => {
  const [excuseModal, setExcuseModal] = useState<{
    record: AttendanceRow;
  } | null>(null);
  const [excuseForm, setExcuseForm] = useState<ExcuseForm>(EMPTY_EXCUSE_FORM);
  const [excuseSaving, setExcuseSaving] = useState(false);

  const excuseAttendanceMutation = useOdooMutation(odooData.excuseAttendance, "attendance");

  const handleSaveExcuse = useCallback(async () => {
    if (!excuseModal) return;
    setExcuseSaving(true);
    try {
      await excuseAttendanceMutation.mutateAsync({
        attendance_id: Number(excuseModal.record.id) || excuseModal.record.id,
        excused_late: excuseForm.late,
        excused_absence: excuseForm.absence,
        excused_shortfall: excuseForm.shortfall,
        excuse_note: excuseForm.note || null,
      });
      setExcuseModal(null);
      await onSaved(excuseModal.record.id, excuseForm);
    } catch {
      localizedAlert(arabicSource("attendance.error_saving_excuse"));
    }
    setExcuseSaving(false);
  }, [excuseForm, excuseModal, onSaved, excuseAttendanceMutation.mutateAsync]);

  const handleCloseExcuseModal = useCallback(() => {
    setExcuseModal(null);
  }, []);

  return {
    excuseModal,
    setExcuseModal,
    excuseForm,
    setExcuseForm,
    excuseSaving,
    handleSaveExcuse,
    handleCloseExcuseModal,
  };
};
