import { useState, useCallback, useMemo } from "react";
import { Save, UserCog } from "lucide-react";
import { Modal, ModalFooterActions, TypeAhead } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { localizedName, useIsArabicLanguage } from "@/i18n/useLocalizedName";
import type { QuickEditDeptDesignationPayload } from "../types";
import { departmentManagerValue } from "../utils/directManager";
import FieldLabel from "./FieldLabel";

const getDepartmentId = (department: DbDepartment): string => department.id;
const getDepartmentLabel = (department: DbDepartment): string => department.name;
const getPositionId = (position: DbPosition): string => position.id;
const getEmployeeId = (employee: DbEmployee): string => employee.id;

type QuickEditDeptDesignationModalProps = {
  employee: DbEmployee;
  dbDepartments: DbDepartment[];
  positions: DbPosition[];
  dbEmployees: DbEmployee[];
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
  dbEmployees,
  saving,
  onClose,
  onSave,
}: QuickEditDeptDesignationModalProps) => {
  const [departmentId, setDepartmentId] = useState(employee.department_id || "");
  const [designationId, setDesignationId] = useState(employee.position_id || "");
  const [managerId, setManagerId] = useState(employee.manager_id || "");

  const isArabic = useIsArabicLanguage();

  // Nobody manages themselves. The backend refuses it too
  // (`manager_self_assignment`) — this just keeps the choice unclickable.
  const managerExcludeIds = useMemo(() => [employee.id], [employee.id]);

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
      // Moving department moves the direct manager with it — the same rule the
      // backend applies on save. Shown here so the form states the outcome
      // instead of the manager silently changing after the request.
      const inherited = departmentManagerValue(dbDepartments, value);
      setManagerId(inherited === employee.id ? "" : inherited);
    },
    [positions, dbDepartments, employee.id],
  );

  const handleDesignationChange = useCallback((value: string): void => {
    setDesignationId(value);
  }, []);

  const handleManagerChange = useCallback((value: string): void => {
    setManagerId(value);
  }, []);

  const handleSave = useCallback((): void => {
    onSave({
      department_id: departmentId || null,
      designation_id: designationId || null,
      // `false`, not `null`: the employee update endpoint reads `null` as
      // "field absent from this patch", so clearing the manager on purpose
      // needs the explicit false. `null` would leave the old one in place.
      manager_id: managerId || false,
    });
  }, [departmentId, designationId, managerId, onSave]);

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
      <div>
        <FieldLabel>{arabicSource("common.direct_manager")}</FieldLabel>
        <TypeAhead
          items={dbEmployees}
          getId={getEmployeeId}
          getLabel={empDisplayName}
          excludeIds={managerExcludeIds}
          value={managerId}
          onChange={handleManagerChange}
          blankLabel={arabicSource("shared.without_a_direct_manager")}
          optionsAreData
        />
      </div>
    </Modal>
  );
};

export default QuickEditDeptDesignationModal;
