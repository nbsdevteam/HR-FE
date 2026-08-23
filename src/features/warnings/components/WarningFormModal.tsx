import { memo, useMemo } from "react";
import {
  getEmployeeDescription,
  getEmployeeId,
  getEmployeeSearchText,
} from "@/shared/utils/employeeTypeAhead";
import { arabicSource } from "@/i18n/source";
import { Button, InputField, Modal, Select, TypeAhead } from "@/shared/components";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import type { FormData } from "../types";

const inputCls =
  "w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none";

type TWarningFormModalProps = {
  form: FormData;
  employees: DbEmployee[];
  warningTypes: string[];
  saving: boolean;
  isEditing: boolean;
  onFieldChange: (patch: Partial<FormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

const WarningFormModal = ({
  form,
  employees,
  warningTypes,
  saving,
  isEditing,
  onFieldChange,
  onSubmit,
  onClose,
}: TWarningFormModalProps) => {
  const employeeFallbackLabels = useMemo(
    () => Object.fromEntries(employees.map((e) => [String(e.id), empDisplayName(e)])),
    [employees],
  );

  const handleEmployeeChange = (id: string): void => {
    onFieldChange({ employeeId: String(id) });
  };

  const handleTypeChange = (value: string): void => {
    onFieldChange({ type: value });
  };

  const handleReasonChange = (reason: string): void => {
    onFieldChange({ reason });
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onFieldChange({ details: e.target.value });
  };

  const handleExpiryDateChange = (expiryDate: string): void => {
    onFieldChange({ expiryDate });
  };

  return (
  <Modal
    onClose={onClose}
    contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto"
    title={
      isEditing
        ? arabicSource("warnings.alarm_adjustment")
        : arabicSource("warnings.new_alarm_issued")
    }
    bodyClassName=""
  >
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          className="text-foreground block mb-1.5"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.employee")}
        </label>
        <TypeAhead
          items={employees}
          getId={getEmployeeId}
          getLabel={empDisplayName}
          getDescription={getEmployeeDescription}
          getSearchText={getEmployeeSearchText}
          fallbackLabels={employeeFallbackLabels}
          value={form.employeeId}
          onChange={handleEmployeeChange}
          placeholder={arabicSource("warnings.find_the_employee")}
        />
      </div>

      <div>
        <label
          className="text-foreground block mb-1.5"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.alarm_type")}
        </label>
        <Select
          value={form.type}
          onChange={handleTypeChange}
          options={warningTypes}
          blankLabel={arabicSource("warnings.choose_the_alarm_type")}
          className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>

      <div>
        <label
          className="text-foreground block mb-1.5"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.the_reason")}
        </label>
        <InputField
          placeholder={arabicSource("warnings.cause_of_alarm")}
          value={form.reason}
          onChange={handleReasonChange}
          className={inputCls}
        />
      </div>

      <div>
        <label
          className="text-foreground block mb-1.5"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.details")}
        </label>
        <textarea
          rows={3}
          placeholder={arabicSource("warnings.alarm_details_2")}
          value={form.details}
          onChange={handleDetailsChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
        />
      </div>

      <div>
        <label
          className="text-foreground block mb-1.5"
          style={{ fontSize: 13 }}
        >
          {arabicSource("warnings.end_date_optional")}
        </label>
        <InputField
          type="date"
          value={form.expiryDate}
          onChange={handleExpiryDateChange}
          className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
          className="flex-1 h-11 shadow-lg shadow-primary/20 cursor-pointer"
        >
          {saving
            ? arabicSource("common.saving")
            : isEditing
              ? arabicSource("warnings.alarm_update")
              : arabicSource("warnings.alarm_issued")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-11 cursor-pointer"
        >
          {arabicSource("common.cancel")}
        </Button>
      </div>
    </form>
  </Modal>
  );
};

export default memo(WarningFormModal);
