import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { Briefcase, Save } from "lucide-react";
import { Modal, ModalFooterActions, PositiveNumberInput, TypeAhead } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { empDisplayName } from "@/shared/hooks";
import type { DbDepartment, DbEmployee } from "@/shared/hooks";
import type { PositionNode } from "../types";
import FieldLabel from "./FieldLabel";

const getDepartmentId = (d: DbDepartment): string => d.id;
const getDepartmentLabel = (d: DbDepartment): string => d.name;
const getEmployeeId = (e: DbEmployee): string => e.id;

export type PositionFormState = {
  title_ar: string;
  title_en: string;
  department_id: string;
  /** The department's configured Direct Manager, edited from here because
   *  this is where the org structure is built. It is saved on the DEPARTMENT,
   *  so it becomes the direct manager of everyone in it — not of this
   *  position alone. Empty string = the department configures none. */
  manager_id: string;
  max_headcount: string;
  description: string;
};

type PositionFormModalProps = {
  editingPosition: PositionNode | null;
  posForm: PositionFormState;
  setPosForm: Dispatch<SetStateAction<PositionFormState>>;
  dbDepartments: DbDepartment[];
  dbEmployees: DbEmployee[];
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
};

const PositionFormModal = ({ editingPosition, posForm, setPosForm, dbDepartments, dbEmployees, onClose, onConfirm, saving }: PositionFormModalProps) => {
  const handleTitleArChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPosForm((p) => ({ ...p, title_ar: e.target.value }));
  };

  const handleTitleEnChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPosForm((p) => ({ ...p, title_en: e.target.value }));
  };

  // Switching department switches which department's Direct Manager this
  // field is editing, so the value has to follow — leaving the old one in
  // place would silently reassign the newly-picked department's manager.
  const handleDepartmentIdChange = (value: string): void => {
    const department = dbDepartments.find((d) => d.id === value);
    setPosForm((p) => ({
      ...p,
      department_id: value,
      manager_id: department?.manager_id || "",
    }));
  };

  const handleManagerIdChange = (value: string): void => {
    setPosForm((p) => ({ ...p, manager_id: value }));
  };

  const handleMaxHeadcountChange = useCallback(
    (value: string): void => setPosForm((p) => ({ ...p, max_headcount: value })),
    [setPosForm],
  );

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setPosForm((p) => ({ ...p, description: e.target.value }));
  };

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
    icon={Briefcase}
    title={editingPosition ? arabicSource("hierarchy.edit_position") : arabicSource("hierarchy.add_a_new_position")}
    footer={
      <ModalFooterActions
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel={editingPosition ? arabicSource("common.save_changes") : arabicSource("hierarchy.create_position")}
        confirmIcon={Save}
        disabled={saving || !posForm.title_ar.trim()}
        loading={saving}
      />
    }
  >
      <div>
        <FieldLabel>{arabicSource("hierarchy.job_title_arabic")}</FieldLabel>
        <input type="text" value={posForm.title_ar} onChange={handleTitleArChange}
          placeholder={arabicSource("hierarchy.example_human_resources_manager")}
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
          style={{ fontSize: 13 }} />
      </div>
      <div>
        <FieldLabel>{arabicSource("hierarchy.job_title_english")}</FieldLabel>
        <input type="text" value={posForm.title_en} onChange={handleTitleEnChange}
          placeholder={arabicSource("hierarchy.example_human_resources_manager")} dir="ltr"
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
          style={{ fontSize: 13 }} />
      </div>
      <div>
        <FieldLabel>{arabicSource("common.section")}</FieldLabel>
        <TypeAhead
          items={dbDepartments}
          getId={getDepartmentId}
          getLabel={getDepartmentLabel}
          value={posForm.department_id}
          onChange={handleDepartmentIdChange}
          blankLabel={arabicSource("common.no_section")}
          optionsAreData
        />
      </div>
      <div>
        <FieldLabel>{arabicSource("common.direct_manager")}</FieldLabel>
        <TypeAhead
          items={dbEmployees}
          getId={getEmployeeId}
          getLabel={empDisplayName}
          value={posForm.manager_id}
          onChange={handleManagerIdChange}
          blankLabel={arabicSource("shared.without_a_direct_manager")}
          disabled={!posForm.department_id}
          optionsAreData
        />
        <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
          {arabicSource("hierarchy.the_department_and_manager_will_be_assigned_automatically_based")}
        </p>
      </div>
      <div>
        <FieldLabel>{arabicSource("hierarchy.maximum_number")}</FieldLabel>
        <PositiveNumberInput value={posForm.max_headcount} onChange={handleMaxHeadcountChange}
          min={1} max={100}
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
          style={{ fontSize: 13 }} dir="ltr" />
      </div>
      <div>
        <FieldLabel>{arabicSource("common.description")}</FieldLabel>
        <textarea value={posForm.description} onChange={handleDescriptionChange}
          rows={2} placeholder={arabicSource("hierarchy.position_description_and_responsibilities")}
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:border-primary/50"
          style={{ fontSize: 13 }} />
      </div>
  </Modal>
  );
};

export default PositionFormModal;
