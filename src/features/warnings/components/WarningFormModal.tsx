import { memo } from "react";
import { motion } from "motion/react";
import { EmployeeSelect } from "@/features/employees";
import { arabicSource } from "@/i18n/source";
import { InputField, Modal, Select } from "@/shared/components";
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
}: TWarningFormModalProps) => (
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
        <EmployeeSelect
          employees={employees}
          labels={Object.fromEntries(
            employees.map((e) => [String(e.id), empDisplayName(e)]),
          )}
          value={form.employeeId}
          onChange={(id) => onFieldChange({ employeeId: String(id) })}
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
          onChange={(e) => onFieldChange({ type: e.target.value })}
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
          onChange={(reason) => onFieldChange({ reason })}
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
          onChange={(e) => onFieldChange({ details: e.target.value })}
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
          onChange={(expiryDate) => onFieldChange({ expiryDate })}
          className="w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <motion.button
          type="submit"
          disabled={saving}
          whileHover={{ scale: !saving ? 1.05 : 1 }}
          whileTap={{ scale: !saving ? 0.95 : 1 }}
          className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? arabicSource("common.saving")
            : isEditing
              ? arabicSource("warnings.alarm_update")
              : arabicSource("warnings.alarm_issued")}
        </motion.button>
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          {arabicSource("common.cancel")}
        </motion.button>
      </div>
    </form>
  </Modal>
);

export default memo(WarningFormModal);
