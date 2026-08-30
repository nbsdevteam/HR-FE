import { useCallback, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { indexBy } from "@/shared/utils/collections";
import type { DbDepartment } from "@/shared/hooks";

export const useDepartmentColors = (departments: DbDepartment[], showToast: (message: string) => void) => {
  const [deptColorEdits, setDeptColorEdits] = useState<Record<string, string>>({});
  const [savingDeptColors, setSavingDeptColors] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  const usedDeptColors = useMemo(() => new Set(
    departments.map(d => deptColorEdits[d.id] ?? d.color).filter(Boolean),
  ), [departments, deptColorEdits]);

  // Indexed once: `getDeptColor` is called for every chip, so the previous
  // `.find()` made rendering the list quadratic in the department count.
  const departmentsById = useMemo(
    () => indexBy(departments, (department) => department.id),
    [departments],
  );

  const getDeptColor = useCallback((deptId: string) => {
    if (deptColorEdits[deptId] !== undefined) return deptColorEdits[deptId];
    return departmentsById.get(deptId)?.color || "#8B5CF6";
  }, [deptColorEdits, departmentsById]);

  const setDeptColor = useCallback((deptId: string, color: string) => {
    setDeptColorEdits(prev => ({ ...prev, [deptId]: color }));
  }, []);

  const toggleColorPicker = useCallback((deptId: string) => {
    setOpenColorPicker(prev => (prev === deptId ? null : deptId));
  }, []);

  const closeColorPicker = useCallback(() => setOpenColorPicker(null), []);

  const saveDeptColors = useCallback(async () => {
    setSavingDeptColors(true);
    try {
      const updates = Object.entries(deptColorEdits).map(([id, color]) => ({ id, color }));
      await odooData.bulkUpdateDepartments(updates);
      setDeptColorEdits({});
      showToast(arabicSource("settings.section_colors_were_saved_successfully"));
    } catch {
      showToast("خطأ في حفظ ألوان الأقسام");
    }
    setSavingDeptColors(false);
  }, [deptColorEdits, showToast]);

  return {
    deptColorEdits, savingDeptColors, openColorPicker,
    usedDeptColors, getDeptColor, setDeptColor, toggleColorPicker, closeColorPicker, saveDeptColors,
  };
};
