import type { Dispatch, SetStateAction } from "react";
import { Briefcase, Save } from "lucide-react";
import { Modal, ModalFooterActions, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";
import type { PositionNode } from "../types";
import FieldLabel from "./FieldLabel";

export type PositionFormState = {
  title_ar: string;
  title_en: string;
  department_id: string;
  max_headcount: string;
  description: string;
};

type PositionFormModalProps = {
  editingPosition: PositionNode | null;
  posForm: PositionFormState;
  setPosForm: Dispatch<SetStateAction<PositionFormState>>;
  dbDepartments: DbDepartment[];
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
};

const PositionFormModal = ({ editingPosition, posForm, setPosForm, dbDepartments, onClose, onConfirm, saving }: PositionFormModalProps) => {
  const handleTitleArChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPosForm((p) => ({ ...p, title_ar: e.target.value }));
  };

  const handleTitleEnChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPosForm((p) => ({ ...p, title_en: e.target.value }));
  };

  const handleDepartmentIdChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setPosForm((p) => ({ ...p, department_id: e.target.value }));
  };

  const handleMaxHeadcountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPosForm((p) => ({ ...p, max_headcount: e.target.value }));
  };

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
        <Select value={posForm.department_id} onChange={handleDepartmentIdChange}
          className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
          style={{ fontSize: 13 }}>
          <option value="">{arabicSource("common.no_section")}</option>
          {dbDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>
      <div>
        <FieldLabel>{arabicSource("hierarchy.maximum_number")}</FieldLabel>
        <input type="number" value={posForm.max_headcount} onChange={handleMaxHeadcountChange}
          min="1" max="100"
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
