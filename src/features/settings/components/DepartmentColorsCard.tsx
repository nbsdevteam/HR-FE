import { useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { Palette } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { indexBy } from "@/shared/utils/collections";
import { useSettingsBootstrap } from "../context/SettingsBootstrapContext";
import { cardCls } from "../styles";
import { useDepartmentColors } from "../hooks/useDepartmentColors";
import DepartmentColorChip from "./DepartmentColorChip";
import DepartmentColorSwatchPicker from "./DepartmentColorSwatchPicker";

type TDepartmentColorsCardProps = {
  showToast: (message: string) => void;
};

const DepartmentColorsCard = ({ showToast }: TDepartmentColorsCardProps) => {
  const { departments, loading: deptLoading } = useSettingsBootstrap();
  const {
    deptColorEdits,
    savingDeptColors,
    openColorPicker,
    usedDeptColors,
    getDeptColor,
    setDeptColor,
    toggleColorPicker,
    closeColorPicker,
    saveDeptColors,
  } = useDepartmentColors(departments, showToast);

  const departmentsById = useMemo(
    () => indexBy(departments, (department) => department.id),
    [departments],
  );

  const activeDept = openColorPicker
    ? departmentsById.get(openColorPicker)
    : undefined;

  const handleSelectDeptColor = useCallback(
    (color: string): void => {
      if (!openColorPicker) return;
      setDeptColor(openColorPicker, color);
      closeColorPicker();
    },
    [openColorPicker, setDeptColor, closeColorPicker],
  );

  const handleCustomDeptColorChange = useCallback(
    (color: string): void => {
      if (!openColorPicker) return;
      setDeptColor(openColorPicker, color);
    },
    [openColorPicker, setDeptColor],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      className={cardCls}
    >
      <div className="flex items-center gap-3 mb-3 pb-2.5 border-b border-border/20">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Palette className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-foreground" style={{ fontSize: 14 }}>
            {arabicSource("settings.section_colors")}
          </h3>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {arabicSource(
              "settings.appears_on_the_organizational_chart_and_employee_cards",
            )}
          </p>
        </div>
      </div>

      {deptLoading ? (
        <div
          className="text-muted-foreground text-center py-3"
          style={{ fontSize: 12 }}
        >
          {arabicSource("common.loading")}
        </div>
      ) : departments.length === 0 ? (
        <div
          className="text-muted-foreground text-center py-3"
          style={{ fontSize: 12 }}
        >
          {arabicSource("common.there_are_no_sections")}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <DepartmentColorChip
                key={dept.id}
                department={dept}
                currentColor={getDeptColor(dept.id)}
                isOpen={openColorPicker === dept.id}
                isEdited={!!deptColorEdits[dept.id]}
                onToggle={toggleColorPicker}
              />
            ))}
          </div>

          {openColorPicker && (
            <DepartmentColorSwatchPicker
              activeColor={getDeptColor(openColorPicker)}
              activeDeptName={activeDept?.name}
              usedDeptColors={usedDeptColors}
              onSelectColor={handleSelectDeptColor}
              onCustomColorChange={handleCustomDeptColorChange}
              onClose={closeColorPicker}
            />
          )}

          {Object.keys(deptColorEdits).length > 0 && (
            <Button
              type="button"
              onClick={saveDeptColors}
              disabled={savingDeptColors}
              className="w-full px-3 py-1.5 cursor-pointer"
              style={{ fontSize: 12 }}
            >
              {savingDeptColors
                ? arabicSource("common.saving")
                : arabicSource("settings.save_section_colors")}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DepartmentColorsCard;
