import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";

export const useDepartmentShiftAssignments = (departments: DbDepartment[], showToast: (message: string) => void) => {
  const [deptShiftAssignments, setDeptShiftAssignments] = useState<Record<string, string>>(
    Object.fromEntries(departments.map((d) => [d.id, d.default_shift_id || ""])),
  );
  const [savingDepts, setSavingDepts] = useState(false);

  const setDeptShift = useCallback((deptId: string, shiftId: string) => {
    setDeptShiftAssignments(prev => ({ ...prev, [deptId]: shiftId }));
  }, []);

  const saveDeptAssignments = useCallback(async () => {
    setSavingDepts(true);
    try {
      for (const [deptId, shiftId] of Object.entries(deptShiftAssignments)) {
        const updateData = shiftId ? { default_shift_id: shiftId } : { default_shift_id: null };
        await odooData.updateDepartment(deptId, updateData);
      }
      showToast(arabicSource("settings.section_assignments_were_saved_successfully"));
    } catch {
      showToast(arabicSource("settings.error_saving_partition_assignments"));
    }
    setSavingDepts(false);
  }, [deptShiftAssignments, showToast]);

  return { deptShiftAssignments, setDeptShift, savingDepts, saveDeptAssignments };
};
