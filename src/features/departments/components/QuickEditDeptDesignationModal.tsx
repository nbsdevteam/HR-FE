import { useState, useCallback } from "react";
import { Save, UserCog } from "lucide-react";
import { Modal, ModalFooterActions, TypeAhead } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { localizedName, useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { QuickEditDeptDesignationPayload } from "../types";
import FieldLabel from "./FieldLabel";

const getDepartmentId = (department: DbDepartment): string => department.id;
const getDepartmentLabel = (department: DbDepartment): string => department.name;
const getPositionId = (position: DbPosition): string => position.id;

type QuickEditDeptDesignationModalProps = {
  employee: DbEmployee;
  dbDepartments: DbDepartment[];
  positions: DbPosition[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: QuickEditDeptDesignationPayload) => void;
};

/**
 * Small quick-edit for an assigned employee's department and job title,
 * opened from a position card row — the fuller `EditEmployeeModal` operates
 * on a different, string-named model and isn't a fit here.
 */
const QuickEditDeptDesignationModal = ({
  employee,
  dbDepartments,
  positions,
  saving,
  onClose,
  onSave,
}: QuickEditDeptDesignationModalProps) => {
  const [departmentId, setDepartmentId] = useState(employee.department_id || "");
  const [designationId, setDesignationId] = useState(employee.position_id || "");

  const isArabic = useIsArabicLanguage();

  // `title_ar`/`title_en` are backend columns, so the option label picks the
  // column matching the active language rather than always showing Arabic.
  const getPositionLabel = useCallback(
    (position: DbPosition): string => localizedName(position.title_ar, position.title_en, isArabic),
    [isArabic],
  );

  const filterPositionsByDepartment = useCallback(
    (position: DbPosition): boolean => !departmentId || position.department_id === departmentId,
    [departmentId],
  );

  const handleDepartmentChange = useCallback(
    (value: string): void => {
      setDepartmentId(value);
      setDesignationId((current) => {
        const stillValid = positions.some(
          (position) => position.id === current && position.department_id === value,
        );
        return stillValid ? current : "";
      });
    },
    [positions],
  );

  const handleDesignationChange = useCallback((value: string): void => {
    setDesignationId(value);
  }, []);

  const handleSave = useCallback((): void => {
    onSave({
      department_id: departmentId || null,
      designation_id: designationId || null,
    });
  }, [departmentId, designationId, onSave]);

  return (
    <Modal
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
      }}
      icon={UserCog}
      title={arabicSource("hierarchy.quick_edit_department_and_job_title")}
      subtitle={<span data-i18n-ignore>{empDisplayName(employee)}</span>}
      headerClassName="bg-blue-500/10"
      iconBadgeClassName="bg-blue-500/20"
      iconColorClassName="text-blue-400"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleSave}
          confirmLabel={arabicSource("common.save_changes")}
          confirmIcon={Save}
          confirmClassName="bg-blue-500 text-white hover:bg-blue-500/90"
          disabled={saving}
          loading={saving}
        />
      }
    >
      <div>
        <FieldLabel>{arabicSource("common.section")}</FieldLabel>
        <TypeAhead
          items={dbDepartments}
          getId={getDepartmentId}
          getLabel={getDepartmentLabel}
          value={departmentId}
          onChange={handleDepartmentChange}
          blankLabel={arabicSource("common.no_section")}
          optionsAreData
        />
      </div>
      <div>
        <FieldLabel>{arabicSource("common.job_title")}</FieldLabel>
        <TypeAhead
          items={positions}
          getId={getPositionId}
          getLabel={getPositionLabel}
          filter={filterPositionsByDepartment}
          value={designationId}
          onChange={handleDesignationChange}
          blankLabel={arabicSource("hierarchy.no_job_title")}
          optionsAreData
        />
      </div>
    </Modal>
  );
};

export default QuickEditDeptDesignationModal;
