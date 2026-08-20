import { useMemo } from "react";
import { EmployeeSelect } from "@/features/employees";
import { arabicSource } from "@/i18n/source";
import { ModalHeader, ModalOverlay, SelectField } from "@/shared/components";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { fieldCls } from "../styles";
import type { EnrollParticipantForm } from "../types";
import TrainingModalFooterActions from "./TrainingModalFooterActions";

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
        employees?.map((e) => [String(e.id), empDisplayName(e)]),
      ),
    [employees],
  );

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
          <EmployeeSelect
            employees={employees}
            labels={employeeLabels}
            value={form.employee_id}
            onChange={(id) => onFieldChange({ employee_id: String(id) })}
            placeholder={arabicSource("training.select_employee")}
            excludeIds={excludeIds}
          />
        </div>

        <SelectField
          label={arabicSource("training.join_status")}
          value={form.completion_status}
          onChange={(value) => onFieldChange({ completion_status: value })}
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
              onChange={(e) => onFieldChange({ score: e.target.value })}
              min="0"
              max="100"
              className={fieldCls}
              placeholder="85"
            />
          </div>
        )}

        <TrainingModalFooterActions
          onSave={onSave}
          onClose={onClose}
          saveLabel={arabicSource("training.register")}
        />
      </div>
    </ModalOverlay>
  );
};

export default EnrollParticipantModal;
