import { useCallback, useMemo, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";

export const useDepartmentColors = (departments: DbDepartment[], showToast: (message: string) => void) => {
  const [deptColorEdits, setDeptColorEdits] = useState<Record<string, string>>({});
  const [savingDeptColors, setSavingDeptColors] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);

  const usedDeptColors = useMemo(() => new Set(
    departments.map(d => deptColorEdits[d.id] ?? d.color).filter(Boolean),
  ), [departments, deptColorEdits]);

  const getDeptColor = useCallback((deptId: string) => {
    if (deptColorEdits[deptId] !== undefined) return deptColorEdits[deptId];
    const dept = departments.find(d => d.id === deptId);
    return dept?.color || "#8B5CF6";
  }, [deptColorEdits, departments]);

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
      for (const [deptId, color] of Object.entries(deptColorEdits)) {
        await odooData.updateDepartment(deptId, { color });
      }
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
