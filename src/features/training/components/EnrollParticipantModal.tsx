import { useMemo } from "react";
import { Save } from "lucide-react";
import {
  getEmployeeDescription,
  getEmployeeId,
  getEmployeeSearchText,
} from "@/features/employees/utils/employeeTypeAhead";
import { arabicSource } from "@/i18n/source";
import { ModalFooterActions, ModalHeader, ModalOverlay, Select, TypeAhead } from "@/shared/components";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { fieldCls, TRAINING_FOOTER_CANCEL_CLASS, TRAINING_FOOTER_WRAPPER_CLASS } from "../styles";
import type { EnrollParticipantForm } from "../types";

type TEnrollParticipantModalProps = {
  form: EnrollParticipantForm;
  employees: DbEmployee[];
  participantStatuses: string[];
  excludeIds: string[];
  onFieldChange: (patch: Partial<EnrollParticipantForm>) => void;
  onSave: () => void;
  onClose: () => void;
};

const EnrollParticipantModal = ({
  form,
  employees,
  participantStatuses,
  excludeIds,
  onFieldChange,
  onSave,
  onClose,
}: TEnrollParticipantModalProps) => {
  const employeeLabels = useMemo(
    () =>
      Object.fromEntries(
        (employees || []).map((e) => [String(e.id), empDisplayName(e)]),
      ),
    [employees],
  );

  const handleEmployeeChange = (id: string): void => {
    onFieldChange({ employee_id: String(id) });
  };

  const handleCompletionStatusChange = (value: string): void => {
    onFieldChange({ completion_status: value });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFieldChange({ score: e.target.value });
  };

  return (
    <ModalOverlay
      onClose={onClose}
      closeOnBackdropClick={false}
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      contentClassName="bg-card border border-border/40 rounded-xl p-6 max-w-md w-full"
      contentMotionProps={{
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
      }}
    >
      <ModalHeader
        title={arabicSource("training.register_a_new_employee")}
        onClose={onClose}
      />

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-foreground mb-2">
            {arabicSource("common.employee_3")}
          </label>
          <TypeAhead
            items={employees}
            getId={getEmployeeId}
            getLabel={empDisplayName}
            getDescription={getEmployeeDescription}
            getSearchText={getEmployeeSearchText}
            fallbackLabels={employeeLabels}
            value={form.employee_id}
            onChange={handleEmployeeChange}
            placeholder={arabicSource("training.select_employee")}
            excludeIds={excludeIds}
          />
        </div>

        <Select
          label={arabicSource("training.join_status")}
          value={form.completion_status}
          onChange={handleCompletionStatusChange}
          options={participantStatuses}
          className={fieldCls}
        />

        {form.completion_status === arabicSource("common.complete") && (
          <div>
            <label className="block text-sm text-foreground mb-2">
              {arabicSource("training.grade")}
            </label>
            <input
              type="number"
              value={form.score}
              onChange={handleScoreChange}
              min="0"
              max="100"
              className={fieldCls}
              placeholder="85"
            />
          </div>
        )}

        <ModalFooterActions
          onCancel={onClose}
          onConfirm={onSave}
          confirmLabel={arabicSource("training.register")}
          confirmIcon={Save}
          reverseOrder
          wrapperClassName={TRAINING_FOOTER_WRAPPER_CLASS}
          cancelClassName={TRAINING_FOOTER_CANCEL_CLASS}
        />
      </div>
    </ModalOverlay>
  );
};

export default EnrollParticipantModal;
